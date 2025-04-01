// CreateCourse.tsx (renombrado a CourseInformationView.tsx o como prefieras)
import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import Heading from "@atlaskit/heading";
import Button from "@atlaskit/button/standard-button";
import Select from "@atlaskit/select";
import Modal, {
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalTitle,
  ModalTransition,
} from "@atlaskit/modal-dialog";
// import {DynamicTableStateless} from "@atlaskit/dynamic-table";
import GroupsView from "./GroupsView"; // Adjust the path as necessary

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  name: string;
  run: string;
  eneatype: string;
}

interface Student {
  id: string;
  name: string;
  email?: string;
  eneatype?: string;
}

// Si el backend retorna un array de string IDs en lugar de objetos Student
interface Course {
  id: string;
  name: string;
  description?: string;
  studentIds: string[]; // Array de IDs
}

interface Option {
  label: string;
  value: string;
}

const API_BASE_URL = "http://4.228.227.51:3000/api";

const CourseInformationView: React.FC = () => {
  const [userData, setUserData] = useState<JwtPayload | null>(null);

  // Datos del curso seleccionado
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  // Lista completa de estudiantes (para agregar)
  const [students, setStudents] = useState<Student[]>([]);
  // Opción seleccionada en el <Select> al agregar un estudiante
  const [selectedStudent, setSelectedStudent] = useState<Option | null>(null);

  // Lista de estudiantes inscritos en el curso, obtenidos vía GET /users/:id
  const [enrolledStudents, setEnrolledStudents] = useState<Student[]>([]);

  const [message, setMessage] = useState<string>("");

  // 1. Obtener el usuario logueado desde localStorage
  useEffect(() => {
    const storedData = localStorage.getItem("userData");
    if (storedData) {
      setUserData(JSON.parse(storedData));
    }
  }, []);

  // 2. Obtener el ID del curso desde localStorage y cargar detalles
  useEffect(() => {
    const fetchCourseDetails = async () => {
      const courseId = localStorage.getItem("courseId");
      if (!courseId) return;

      try {
        // Suponiendo que GET /courses retorna un array de cursos
        // y filtramos el que coincida con el courseId
        const response = await axios.get<Course[]>(`${API_BASE_URL}/courses`);
        const foundCourse =
          response.data.find((c) => c.id === courseId) || null;
        if (!foundCourse) return;

        // Guardamos el curso en el estado
        setSelectedCourse(foundCourse);

        // Una vez tengamos studentIds, pedimos info detallada de cada uno
        if (foundCourse.studentIds && foundCourse.studentIds.length > 0) {
          // Peticiones en paralelo para cada ID
          const requests = foundCourse.studentIds.map((id) =>
            axios.get<Student>(`${API_BASE_URL}/users/${id}`)
          );
          const results = await Promise.all(requests);
          const detailedStudents = results.map((r) => r.data);
          setEnrolledStudents(detailedStudents);
        } else {
          setEnrolledStudents([]);
        }
      } catch (error: any) {
        console.error(
          "Error al obtener detalles del curso:",
          error.response?.data || error.message
        );
      }
    };
    fetchCourseDetails();
  }, []);

  // 3. Obtener la lista global de estudiantes (para el <Select> de "Agregar Estudiante")
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await axios.get<Student[]>(
          `${API_BASE_URL}/users/students`
        );
        setStudents(response.data);
      } catch (error: any) {
        console.error(
          "Error al obtener estudiantes:",
          error.response?.data || error.message
        );
      }
    };
    fetchStudents();
  }, []);

  // 4. Agregar estudiante al curso
  const onAddStudent = async () => {
    const courseId = localStorage.getItem("courseId");
    if (!courseId || !selectedStudent) return;

    const studentId = selectedStudent.value;
    // Verificar si el estudiante ya está en enrolledStudents
    if (enrolledStudents.some((s) => s.id === studentId)) {
      setMessage("El estudiante ya ha sido agregado al curso.");
      return;
    }

    try {
      await axios.post(`${API_BASE_URL}/courses/${courseId}/add-student`, {
        courseId,
        studentId,
      });
      // Actualizar la lista local
      const studentAdded = students.find((s) => s.id === studentId);
      if (studentAdded) {
        setEnrolledStudents((prev) => [...prev, studentAdded]);
        setMessage(`Estudiante ${studentAdded.name} agregado.`);
      }
    } catch (error: any) {
      console.error(
        "Error al agregar estudiante:",
        error.response?.data || error.message
      );
      setMessage("Error al agregar el estudiante.");
    }
  };

  // 5. Eliminar estudiante
  const handleRemoveStudent = async (studentId: string) => {
    if (!selectedCourse) return;

    const confirmDelete = window.confirm(
      "¿Está seguro de eliminar este estudiante del curso?"
    );
    if (!confirmDelete) return;

    try {
      await axios.post(
        `${API_BASE_URL}/courses/${selectedCourse.id}/remove-student`,
        { studentId }
      );
      // Remover de la lista local
      setEnrolledStudents((prev) => prev.filter((s) => s.id !== studentId));
      setMessage("Estudiante eliminado del curso.");
    } catch (error: any) {
      console.error(
        "Error al eliminar estudiante:",
        error.response?.data || error.message
      );
      setMessage("Error al eliminar estudiante.");
    }
  };

  // Opciones para el <Select> de agregar estudiantes
  const studentOptions: Option[] = students.map((student) => ({
    label: `${student.name} (${student.email || student.id})`,
    value: student.id,
  }));

  // para el dialogo modal de GroupsCreate
  const [isOpenGroupsCreate, setIsOpenGroupsCreate] = useState(false);
  const openModalGroupsCreate = useCallback(
    () => setIsOpenGroupsCreate(true),
    []
  );
  const closeModalGroupsCreate = useCallback(() => {
    setIsOpenGroupsCreate(false);
  }, []);

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "20px" }}>
      {/* Botón claramente visible para ver/crear grupos */}
      <Button
        appearance="primary"
        style={{ marginTop: "20px", marginBottom: "20px" }}
        onClick={openModalGroupsCreate}
      >
        {userData?.role === "profesor" ? "Ver/Crear Grupos" : "Ver Grupos"}
      </Button>

      {/* Si el usuario es profesor, mostrar sección para agregar estudiantes */}
      {userData?.role === "profesor" && (
        <div style={{ marginTop: "20px", marginBottom: "20px" }}>
          <Heading size="medium">Agregar Estudiantes</Heading>
          <br />
          <Heading size="small">
            Seleccione un estudiante y haga clic en "Agregar Estudiante".
          </Heading>
          <br />
          <Select<Option>
            options={studentOptions}
            placeholder="Seleccione estudiante"
            onChange={(newValue) => setSelectedStudent(newValue)}
            isClearable
          />
          <div style={{ marginTop: "20px", marginBottom: "20px" }}>
            <Button appearance="primary" onClick={onAddStudent}>
              Agregar Estudiante
            </Button>
          </div>
          {message && (
            <div style={{ marginTop: "20px", color: "green" }}>
              <strong>{message}</strong>
            </div>
          )}
        </div>
      )}

      {/* Información del curso */}
      <div style={{marginBottom: "20px"}}>
        <Heading size="medium">{selectedCourse?.name}</Heading>
      </div>
      {selectedCourse?.description && (
        <Heading size="small">
          Descripción: {selectedCourse.description}
        </Heading>
      )}
      <br />

      {/* Lista de estudiantes inscritos (datos completos) */}
      <div style={{ textAlign: "left" }}>
        <Heading size="medium">Estudiantes Inscritos:</Heading>
      </div>
      {enrolledStudents.length === 0 ? (
        <p>No hay estudiantes inscritos.</p>
      ) : (
        <ul>
          {enrolledStudents.map((student) => (
            <li
              key={student.id}
              style={{ marginBottom: "8px", textAlign: "left" }}
            >
              <Heading size="small">
                {student.name} ({student.email})
                {userData?.role.toLowerCase() === "profesor" && (
                  <Button
                    appearance="danger"
                    onClick={() => handleRemoveStudent(student.id)}
                    style={{ marginLeft: "10px" }}
                  >
                    Eliminar
                  </Button>
                )}
              </Heading>
            </li>
          ))}
        </ul>
      )}

      {/* DIALOGO MODAL */}
      <ModalTransition>
        {isOpenGroupsCreate && (
          <Modal
            onClose={closeModalGroupsCreate}
            width={"x-large"}
            shouldScrollInViewport
          >
            <ModalHeader></ModalHeader>
            <ModalBody>
              <GroupsView />
              {/* llamada a microfrontend */}
            </ModalBody>
            <ModalFooter>
              <Button appearance="subtle" onClick={closeModalGroupsCreate}>
                Cerrar
              </Button>
            </ModalFooter>
          </Modal>
        )}
      </ModalTransition>
    </div>
  );
};

export default CourseInformationView;
