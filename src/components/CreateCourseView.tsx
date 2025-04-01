// CreateCourse.tsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Form, { Field, FormHeader, FormSection, FormFooter } from '@atlaskit/form';
import TextField from '@atlaskit/textfield';
import Button from '@atlaskit/button/standard-button';
import Select, { ValueType } from '@atlaskit/select';
import Heading from '@atlaskit/heading';

// Interfaz para el payload del usuario
export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  name: string;
  run: string;
  eneatype: string;
}

// Interfaz para el estudiante obtenido desde el backend
interface Student {
  id: string;
  name: string;
  email: string;
  eneatype?: string;
}

// Opcional: interfaz para la opción del Select
interface Option {
  label: string;
  value: string;
}

// URL base de la API (ajusta según tu configuración)
const API_BASE_URL = "http://4.228.227.51:3000/api";

const CreateCourseView: React.FC = () => {
  const [courseCreated, setCourseCreated] = useState<boolean>(false);
  const [courseId, setCourseId] = useState<string>('');
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<ValueType<Option>>(null);
  const [addedStudents, setAddedStudents] = useState<Student[]>([]);
  const [message, setMessage] = useState<string>('');

  // Obtener información del profesor logueado
  const storedUserData = localStorage.getItem("userData");
  const professor: JwtPayload | null = storedUserData ? JSON.parse(storedUserData) : null;

  // Cargar la lista de estudiantes al montar el componente
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/users/students`);
        setStudents(response.data);
      } catch (error: any) {
        console.error("Error al obtener estudiantes:", error.response?.data || error.message);
      }
    };
    fetchStudents();
  }, []);

  // Handler para crear curso
  const onCreateCourse = async (values: { name: string; description?: string }) => {
    if (!professor) {
      setMessage("No se encontró información del profesor en sesión.");
      return;
    }
    try {
      // Se envía el createCourseDto con professorId tomado de la sesión activa
      const createCourseDto = { ...values, professorId: professor.sub };
      const response = await axios.post(`${API_BASE_URL}/courses`, createCourseDto);
      setCourseId(response.data.id); // Se asume que el id del curso viene en response.data.id
      setCourseCreated(true);
      setMessage("Curso creado correctamente.");
    } catch (error: any) {
      console.error("Error al crear curso:", error.response?.data || error.message);
      setMessage("Error al crear el curso.");
    }
  };

  const onAddStudent = async () => {
    if (!courseId) return;
    if (!selectedStudent || typeof selectedStudent === 'string') return;
  
    const studentId = selectedStudent.value;
  
    // Verificar si el estudiante ya fue agregado
    if (addedStudents.some(student => student.id === studentId)) {
      setMessage("El estudiante ya ha sido agregado al curso.");
      return;
    }
  
    try {
      await axios.post(`${API_BASE_URL}/courses/${courseId}/add-student`, {courseId, studentId});
      const studentAdded = students.find(s => s.id === studentId);
      if (studentAdded) {
        setAddedStudents(prev => [...prev, studentAdded]);
        setMessage(`Estudiante ${studentAdded.name} agregado.`);
      }
    } catch (error: any) {
      console.error("Error al agregar estudiante:", error.response?.data || error.message);
      setMessage("Error al agregar el estudiante.");
    }
  };

  // Opciones para el select de estudiantes
  const studentOptions: Option[] = students.map(student => ({
    label: `${student.name} (${student.email})`,
    value: student.id,
  }));

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "20px" }}>
      <Heading size="medium">Crear Curso</Heading>
      {!courseCreated ? (
        <Form<{ name: string; description?: string }>
          onSubmit={onCreateCourse}
        >
          {({ formProps, submitting }) => (
            <form {...formProps}>
              <FormHeader title="Información del Curso" />
              <FormSection>
                <Field name="name" label="Nombre del curso" isRequired>
                  {({ fieldProps }) => <TextField {...fieldProps} />}
                </Field>
                <Field name="description" label="Descripción">
                  {({ fieldProps }) => <TextField {...fieldProps} />}
                </Field>
              </FormSection>
              <FormFooter>
                <Button appearance="primary" type="submit">
                  Crear Curso
                </Button>
              </FormFooter>
            </form>
          )}
        </Form>
      ) : (
        <div>
          <Heading size="medium">Curso Creado (ID: {courseId})</Heading>
          {message}
        </div>
      )}

      {courseCreated && (
        <div style={{ marginTop: "40px" }}>
          <Heading size="medium">Agregar Estudiantes</Heading>
          <p>Seleccione un estudiante y haga clic en "Agregar".</p>
          <Select<Option>
            options={studentOptions}
            placeholder="Seleccione estudiante"
            onChange={(newValue) => setSelectedStudent(newValue)}
            isClearable
          />
          <div style={{ marginTop: "20px" }}>
            <Button appearance="primary" onClick={onAddStudent}>
              Agregar Estudiante
            </Button>
          </div>
          {addedStudents.length > 0 && (
            <div style={{ marginTop: "20px" }}>
              <Heading size="medium">Estudiantes Agregados:</Heading>
              <ul>
                {addedStudents.map(student => (
                  <li key={student.id}>{student.name} ({student.email})</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      {message && (
        <div style={{ marginTop: "20px", color: "green" }}>
          <strong>{message}</strong>
        </div>
      )}
    </div>
  );
};

export default CreateCourseView;