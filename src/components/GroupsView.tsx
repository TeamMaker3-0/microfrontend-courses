// GroupsView.tsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import Heading from "@atlaskit/heading";
import Button from "@atlaskit/button/standard-button";
import Form, {
  Field,
  FormFooter,
  FormSection,
  FormHeader,
} from "@atlaskit/form";
import TextField from "@atlaskit/textfield";

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  name: string;
  run: string;
  eneatype: string;
}

interface Group {
  group_number: number;
  course_id: string;
  student_ids: string[];
}

interface Student {
  id: string;
  name: string;
  email?: string;
  eneatype?: string;
}

interface Course {
  id: string;
  name: string;
  description?: string;
  studentIds: string[]; // Array de IDs
}

interface SocialSurveyResponse {
  id: string;
  studentId: string;
  courseId: string;
  isCompleted: boolean;
  responses?: any;
}

interface CaracterialSurveyResponse {
  id: string;
  studentId: string;
  isCompleted: boolean;
}

export interface CombinedStudent {
  id: string;
  eneatype?: number;
  favoritos: any;
  favorito_de: any;
  no_favoritos: any;
  no_favorito_de: any;
}

const API_BASE_URL = "http://4.228.227.51:3000/api";

const GroupsView: React.FC = () => {
  const [userData, setUserData] = useState<JwtPayload | null>(null);
  const [courseId, setCourseId] = useState<string>("");
  const [groups, setGroups] = useState<Group[]>([]);
  const [globalStudents, setGlobalStudents] = useState<Student[]>([]);
  const [message, setMessage] = useState<string>("");
  const [cantEstudiantes, setcantEstudiantes] = useState<number>();
  const [accion, setAccion] = useState<string>("");

  const [course, setCourse] = useState<Course | null>(null);
  const [socialStatus, setSocialStatus] = useState<SocialSurveyResponse[]>([]);
  const [caracterialStatus, setCaracterialStatus] = useState<
    CaracterialSurveyResponse[]
  >([]);

  // 1. Cargar userData y courseId desde localStorage (clave "courseId")
  useEffect(() => {
    const storedUser = localStorage.getItem("userData");
    if (storedUser) {
      setUserData(JSON.parse(storedUser));
    }
    const storedCourseId = localStorage.getItem("courseId");
    if (storedCourseId) {
      setCourseId(storedCourseId);
      console.log("CourseId cargado:", storedCourseId);
    } else {
      console.log("No se encontró courseId en localStorage.");
    }
  }, []);

  // 2. Cargar grupos según rol y courseId
  useEffect(() => {
    if (!userData || !courseId) return;

    const fetchGroups = async () => {
      try {
        let url = "";
        console.log("userData.role", userData.role);
        console.log("userData.sub", userData.sub);
        console.log("courseId", courseId);
        if (userData.role.toLowerCase() === "profesor") {
          // GET /api/groups/course/:courseId
          url = `${API_BASE_URL}/groups/course/${courseId}`;
          const response = await axios.get<Group[]>(url);
          setGroups(response.data);
          console.log("Grupos cargados:", response.data);
        }
        if (userData.role.toLowerCase() === "estudiante") {
          // GET /api/groups/student/:studentId
          url = `${API_BASE_URL}/groups/student/${userData.sub}`;
          const response = await axios.get<Group[]>(url);

          const userResponse = response.data.find(
            (res) => res.course_id === courseId
          );

          if (userResponse) {
            setGroups([userResponse]);
          }
          console.log("Grupos cargados:", response.data);
        }
      } catch (error: any) {
        console.error(
          "Error al obtener grupos:",
          error.response?.data || error.message
        );
        setMessage("No se pudieron cargar los grupos.");
      }
    };
    fetchGroups();
  }, [userData, courseId]);

  // 3. Cargar la lista global de estudiantes
  useEffect(() => {
    const fetchGlobalStudents = async () => {
      try {
        const response = await axios.get<Student[]>(
          `${API_BASE_URL}/users/students`
        );
        setGlobalStudents(response.data);

        try {
          const response = await axios.get<Course[]>(
            `${API_BASE_URL}/courses/`
          );
          const storedCourseId = localStorage.getItem("courseId");
          const course = response.data.find((c) => c.id === storedCourseId);
          if (course) {
            console.log("Curso encontrado:", course);
            setcantEstudiantes(course.studentIds.length);
          } else {
            console.log("No se encontró el curso con id:", storedCourseId);
          }
        } catch (error: any) {
          console.error(
            "Error al obtener detalles del curso:",
            error.response?.data || error.message
          );
        }
      } catch (error: any) {
        console.error(
          "Error al obtener la lista global de estudiantes:",
          error.response?.data || error.message
        );
      }
    };
    fetchGlobalStudents();
  }, []);

  // Cargar el curso actual (se asume que courseId está almacenado en localStorage)
  useEffect(() => {
    const courseId = localStorage.getItem("courseId");
    if (!courseId) return;

    const fetchCourse = async () => {
      try {
        const response = await axios.get<Course[]>(`${API_BASE_URL}/courses/`);
        const course = response.data.find((c) => c.id === courseId);
        if (course) {
          console.log("Curso encontrado:", course);
          setCourse(course);
        } else {
          console.log("No se encontró el curso con id:", courseId);
        }
      } catch (error) {
        console.error("Error al cargar curso:", error);
      }
    };

    fetchCourse();
  }, []);

  function combineStudentSocialData(
    allStudents: Student[],
    socialResponses: SocialSurveyResponse[],
    number_of_groups: number,
    course_id: string
  ): {
    course_id: string;
    number_of_groups: number;
    students: CombinedStudent[];
  } {
    const combinedStudents: CombinedStudent[] = allStudents.map((student) => {
      // Buscar el registro de encuesta correspondiente al estudiante para este curso
      let social = socialResponses.find(
        (r) => r.studentId === student.id && r.courseId === course_id
      );

      let favoritos: any = [];
      let favorito_de: any = [];
      let no_favoritos: any = [];
      let no_favorito_de: any = [];

      console.log("Estudiante:", student.name);
      console.log("Encuesta social:", social);
      if (social && social.responses) {
        console.log("Respuestas de encuesta social:", social.responses);
        console.log("Respuestas q1:", social.responses.q1);
        favoritos = social.responses.q1 || [];
        favorito_de = social.responses.q2 || [];
        no_favoritos = social.responses.q3 || [];
        no_favorito_de = social.responses.q4 || [];
      }

      return {
        id: student.id,
        eneatipo: student.eneatype ? parseInt(student.eneatype) : undefined, // Suponiendo que "eneatipo" equivale a "eneatype"
        favoritos,
        favorito_de,
        no_favoritos,
        no_favorito_de,
      };
    });

    return { course_id, number_of_groups, students: combinedStudents };
  }

  // 4. Crear grupos (solo para profesor)
  const onCreateGroups = async (values: { number_of_groups: string }) => {
    if (!courseId) return;
    if (accion === "crearAleatorio") {
      try {
        // POST /api/groups/create-random
        const response = await axios.post(
          `${API_BASE_URL}/groups/create-random`,
          {
            course_id: courseId,
            number_of_groups: parseInt(values.number_of_groups, 10),
          }
        );
        setGroups(response.data);
        setMessage("Grupos creados/actualizados exitosamente.");
        console.log("Respuesta de creación de grupos:", response.data);
      } catch (error: any) {
        console.error(
          "Error al crear grupos:",
          error.response?.data || error.message
        );
        setMessage("Error al crear grupos.");
      }
    }
    if (accion === "crearEspecializado") {
      const confirmSend = window.confirm(
        "¿Está seguro de crear grupos especializados? Verifique que todas las encuestas estén completas y actualizadas. De igual forma puede crear los grupos omitiendo las respuestas de aquellos que faltan."
      );
      if (!confirmSend) return;

      try {
        // Llamada al endpoint para estado de encuesta social
        const socialRes = await axios.get<SocialSurveyResponse[]>(
          `${API_BASE_URL}/surveys/all-social`
        );
        const allSocial = socialRes.data.filter((c) => c.courseId === courseId);
        setSocialStatus(allSocial);
        console.log("Estado de encuesta social:", allSocial);

        const allStudents = globalStudents.filter((s) =>
          course?.studentIds.includes(s.id)
        );
        console.log("Estudiantes:", allStudents);
        const combinedStudents = combineStudentSocialData(
          allStudents,
          allSocial,
          parseInt(values.number_of_groups, 10),
          courseId
        );
        console.log("Estudiantes combinados:", combinedStudents);

        try {
          // POST /api/groups/create-specialized
          const response = await axios.post(
            `${API_BASE_URL}/groups/create-specialized`,
            {
              course_id: courseId,
              number_of_groups: parseInt(values.number_of_groups, 10),
              students: combinedStudents.students,
            }
          );
          setGroups(response.data);
          setMessage("Grupos creados/actualizados exitosamente.");
          console.log("Respuesta de creación de grupos:", response.data);
        } catch (error: any) {
          console.error(
            "Error al crear grupos:",
            error.response?.data || error.message
          );
          setMessage("Error al crear grupos.");
        }
      } catch (error: any) {
        console.error(
          "Error al obtener estado de encuesta social:",
          error.response?.data || error.message
        );
      }
    }
  };

  // Función para obtener los datos completos de un estudiante a partir de su ID
  const getStudentDetails = (studentId: string): Student | undefined => {
    return globalStudents.find((s) => s.id === studentId);
  };

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "20px" }}>
      <div style={{ textAlign: "center" }}>
        <Heading size="large">Grupos</Heading>
      </div>
      {message && <p style={{ color: "green" }}>{message}</p>}

      {/* Lista de grupos */}
      {groups.length === 0 ? (
        <Heading size="medium">No hay grupos creados aún.</Heading>
      ) : (
        <div>
          {groups.map((g, index) => (
            <div
              key={index}
              style={{ marginBottom: "20px", marginTop: "20px" }}
            >
              {userData?.role.toLowerCase() === "estudiante" && (
                <Heading size="small">
                  Su grupo es el N°{g.group_number}:
                </Heading>
              )}

              {userData?.role.toLowerCase() === "profesor" && (
                <Heading size="small">Grupo N°{g.group_number}</Heading>
              )}
              <ul>
                {g.student_ids.length === 0 ? (
                  <li>No hay estudiantes inscritos.</li>
                ) : (
                  g.student_ids.map((studentId) => {
                    const student = getStudentDetails(studentId);
                    return (
                      <li key={studentId}>
                        <Heading size="small">
                          {student
                            ? `${student.name} (${student.email})`
                            : studentId}
                        </Heading>
                      </li>
                    );
                  })
                )}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* Formulario para crear grupos si es profesor */}
      {userData?.role.toLowerCase() === "profesor" && (
        <div style={{ marginTop: "20px" }}>
          <Heading size="medium">Crear/Actualizar Grupos</Heading>
          <Form<{ number_of_groups: string }> onSubmit={onCreateGroups}>
            {({ formProps, submitting }) => (
              <form {...formProps}>
                <FormSection>
                  <Field
                    name="number_of_groups"
                    label="Ingrese la cantidad de grupos"
                    isRequired
                    validate={(value: string | undefined) => {
                      if (!value) {
                        return "El número de grupos es requerido";
                      }
                      const num = parseInt(value, 10);
                      if (isNaN(num) || num <= 0) {
                        return (
                          "El número de grupos debe ser mayor que cero, numero actual es " +
                          num
                        );
                      }
                      //   Si se requiere, se puede verificar que el número de grupos no sea mayor que la cantidad de estudiantes disponibles
                      //   Por ejemplo, si globalStudents es la lista de estudiantes a distribuir:
                      if (num > (cantEstudiantes || 0)) {
                        return (
                          "No hay suficientes estudiantes para esa cantidad de grupos cantidad de estudiantes es " +
                          cantEstudiantes
                        );
                      }
                    }}
                  >
                    {({ fieldProps, error }) => (
                      <>
                        <TextField type="number" {...fieldProps} />
                        {error && <span style={{ color: "red" }}>{error}</span>}
                      </>
                    )}
                  </Field>
                </FormSection>
                <FormFooter>
                  <Button
                    appearance="primary"
                    type="submit"
                    onClick={() => setAccion("crearAleatorio")}
                  >
                    Crear grupos Aleatorios
                  </Button>
                  <Button
                    appearance="primary"
                    type="submit"
                    style={{ marginLeft: "10px" }}
                    onClick={() => setAccion("crearEspecializado")}
                  >
                    Crear grupos Especializados
                  </Button>
                </FormFooter>
              </form>
            )}
          </Form>
        </div>
      )}
    </div>
  );
};

export default GroupsView;
