let gUsers;
let gProgress;
let gCourses;
let gCohorts;
// Constantes de tablas en html.
const lecTable = document.getElementById('infoLectureTable');
const infTable = document.getElementById('generalInfBody');
const resStdTable = document.getElementById('resumenStudentBody');
const pQuizzesTable = document.getElementById('pQuizzesTable');
const pEjerciciosTable = document.getElementById('pEjerciciosTable');
const infoPQuizzesTable = document.getElementById('infoPQuizzesTable');
const infoPEjerciciosTable = document.getElementById('infoPEjerciciosTable');

// Constantes de secciones de la página.
const infPage = document.getElementById('generalInformationPage');
const lecPage = document.getElementById('lectureProgressPage');
const resStdPage = document.getElementById('resumenStudentPage');
const pQuizzesProgressPage = document.getElementById('pQuizzesProgressPage');
const pEjerciciosProgressPage = document.getElementById('pEjerciciosProgressPage');

// Constantes de botones.
const btnLecture = document.getElementById('lectures');
const btnInformation = document.getElementById('generalInfo');
const btnResumenAlumna = document.getElementById('btnResumenAlumna');
const pQuizzes = document.getElementById('pQuizzes');
const pEjercicios = document.getElementById('pEjercicios');

// Constante de input.
const inpStudent = document.getElementById('userFinder');

window.onload = function start() { // Evento onload (Cuando termina de cargar todo el contenido de la pág) ejecuta función Start
  
  getApiData('scl-2018-05-bc-core-am'); // Llama por de defecto para que el usuario vea datos y no este en blanco.
  
};

function getApiData(cohort) { // Función que obtiene datos desde la API.
  hideContent(); // Oculta todo antes de mostrar algo.
  titleCohort.innerText = 'cargando...'; // Reemplaza contenido de titulo por cargando... 
  Promise.all([ // Llama la info de API en paralelo(Todas a la vez)
    fetch('https://api.laboratoria.la/cohorts/' + cohort + '/users'),
    fetch('https://api.laboratoria.la/cohorts/' + cohort + '/progress'),
    fetch('https://api.laboratoria.la/cohorts/' + cohort + '/courses'),
    fetch('https://api.laboratoria.la/cohorts/')
  ]).then((responses)=>{ // Se cumplen promesas
    return Promise.all(responses.map((response => response.json()))); // Convertir todo de string a objeto.
  }).then((responseJsons)=>{ // Cuando termina la promesa entrega los objetos Json (array)
    const users = responseJsons[0].filter(element => element.role === 'student');// Se filtra el resultado de la API users a solo los que tengan "role" student
    const progress = responseJsons[1];// Toma el dato sin filtro desde API.
    const courses = responseJsons[2];
    const cohorts = responseJsons[3];
    gUsers = users; // La const entrega a la variable global los datos obtenidos de la API.
    gProgress = progress;
    gCourses = courses;
    gCohorts = cohorts;

    if (users && progress && courses) { // Si... los parametros tienen algo, entra al bloque.
      computeUsersStats(users, progress, courses);// Llama al computeUsersStats con datos obtenidos de la API
      getCohorts(cohorts);
    }
    titleCohort.innerText = cohort;// Una ve que los datos son cargados, cambia el titulo al nombre del cohort seleccionado.

  }).catch(
    (error)=>{ // Si una llamada falla, se ejecuta error.
      console.log('Error al llamar API.' + error);
    });
}

btnInformation.addEventListener('click', () => { // Asigna el evento click al botón información. 
  generalInformation(gUsers); 
  resumenCohort(gUsers);
});

function generalInformation(users) { 
  changeTitle('INFORMACIÓN GENERAL'); // Ejecuta la función para cambiar titulo principal.
  hideContent(); // Oculta todas las tablas de contenido.
  document.getElementById('generalInfBody').innerHTML = ''; // Limpia el contenido del body.
  const renderUsers = users.forEach(element => { 
    // Los promedios se obtienen de aquí.
    let averageStudent = Math.round((element.stats.reads.percent + element.stats.quizzes.percent + element.stats.exercises.percent) / 3);
    let names = `<tr><td>${element.name}</td><td>${averageStudent}%</td><td>${element.stats.reads.percent}%</td><td>${element.stats.quizzes.percent}%</td><td>${element.stats.exercises.percent}%</td></tr>`;
    return infTable.innerHTML += names; // Agrega el html creado en name a la tabla infTable en HTML.
  });
  
  infPage.style.display = 'block'; // Una vez que recorre todos los usuarios muestra la Información General.
}
btnResumenAlumna.addEventListener('click', () => {
  if (inpStudent.value !== '') {
    // Armamos objeto options, con las propiedades solicitadas.
    const options = {
      cohort: gCohorts,
      cohortData: {
        users: gUsers,
        progress: gProgress,
        courses: gCourses
      },
      orderBy: 'name',
      orderDirection: 'ASC',
      search: inpStudent.value
    };
    // Hacemos la llamada a la función processCohortData.
    processCohortData(options);
    resumenStudentBody(gUsers, inpStudent.value);
  } else {
    resStdTable.innerHTML = ''; // Limpia la tabla.
    let names = `<tr colspan="5"><td>Tiene que ingresar algún filtro para buscar alumnas</td></tr>`;
    resStdTable.innerHTML += names; // Agrega el mensaje de name al HTML en la tabla.
    hideContent(); // Oculta el contenido del body.
    resStdPage.style.display = 'block'; // Muestra contenido del body.
  }
});
function resumenStudentBody(users, search) {
  changeTitle('RESUMEN ALUMNA'); // Cambia titulo principal.
  hideContent(); // Oculta contenido.
  resStdTable.innerHTML = ''; // Limpia contenido de la tabla.
  filterUsers(users, search).forEach(element => { // Devuelve array de usuarios filtrados y el foreach los recorre.
    // Los promedios se obtienen de aquí.
    let averageStudent = Math.round((element.stats.reads.percent + element.stats.quizzes.percent + element.stats.exercises.percent) / 3);
    let names = `<tr><td>${element.name}</td><td>${averageStudent}%</td><td>${element.stats.reads.percent}%</td><td>${element.stats.quizzes.percent}%</td><td>${element.stats.exercises.percent}%</td></tr>`;
    return resStdTable.innerHTML += names; 
  });
  resStdPage.style.display = 'block'; // Muestra, el bloque completo del resumen de alumna.
}
// RESUMEN COHORT
function resumenCohort(users) {
  let sinAvance = [0, 0, 0]; // Acumulador para sin avance de Quizzes, Lecturas, Ejercicios.
  let noOptimo = [0, 0, 0]; // Acumulador para no óptimo de Quizzes, Lecturas, Ejercicios.
  let optimo = [0, 0, 0]; // Acumulador para óptimo de Quizzes, Lecturas, Ejercicios.
  users.forEach(element => {
    if (element.stats.quizzes.percent === 0) {
      sinAvance[0]++;
    }
    if (element.stats.reads.percent === 0) {
      sinAvance[1]++;
    }
    if (element.stats.exercises.percent === 0) {
      sinAvance[2]++;
    }
    if (element.stats.quizzes.percent > 0 && element.stats.quizzes.percent < 70) {
      noOptimo[0]++;
    }
    if (element.stats.reads.percent > 0 && element.stats.reads.percent < 70) {
      noOptimo[1]++;
    }
    if (element.stats.exercises.percent > 0 && element.stats.exercises.percent < 70) {
      noOptimo[2]++;
    }
    if (element.stats.quizzes.percent >= 70 && element.stats.quizzes.percent <= 100) {
      optimo[0]++;
    }
    if (element.stats.reads.percent >= 70 && element.stats.reads.percent <= 100) {
      optimo[1]++;
    }
    if (element.stats.exercises.percent >= 70 && element.stats.exercises.percent <= 100) {
      optimo[2]++;
    }
  });
  summaryCohorts(sinAvance, noOptimo, optimo, users.length);// User.length es para saber la cantidad de alumnas que hay.
};

// Porcentajes totales.
function summaryCohorts(sinAvance, noOptimo, optimo, userCount) { // Arma resumen de Cohort.
  const progressRow = document.getElementById('progressRow');
  const notOptimalRow = document.getElementById('notOptimalRow');
  const optimalRow = document.getElementById('optimalRow');
  const totalRow = document.getElementById('totalRow');
  totalRow.children[1].innerText = userCount;
  for (let i = 0; i < 3;i++) {
    progressRow.children[i + 1].innerText = Math.round((parseInt(sinAvance[i]) * 100) / parseInt(userCount)) + '%';  
    notOptimalRow.children[i + 1].innerText = Math.round((parseInt(noOptimo[i]) * 100) / parseInt(userCount)) + '%';  
    optimalRow.children[i + 1].innerText = Math.round((parseInt(optimo[i]) * 100) / parseInt(userCount)) + '%'; 
  }
}

// Se llama al momento de hacer click en el botón Avance de Lecturas.
btnLecture.addEventListener('click', () => {
  lectureProgress(gUsers);
});
function lectureProgress(users) {
  const renderUsers = users.forEach(element => {
    let names = `<tr><td>${element.name}</td><td>${element.stats.reads.percent}%</td></tr>`;
    return lecTable.innerHTML += names;
  });
  changeTitle('AVANCE DE LECTURAS');// Cambia el titulo por información general.
  hideContent();// Esconde todos los contenidos.
  lecPage.style.display = 'block';// Muestra el contenido información general.
};
// Se llama al momento de hacer click en el botón promedio quizzes.
pQuizzes.addEventListener('click', () => {
  quizzesAverage(gUsers);
});
function quizzesAverage(users) {
  const renderUsers = users.forEach(element => {
    let names = `<tr><td>${element.name}</td><td>${isNaN(element.stats.quizzes.scoreAvg) ? 0 : element.stats.quizzes.scoreAvg}%</td></tr>`;
    return infoPQuizzesTable.innerHTML += names;
  });
  changeTitle('PROMEDIO DE QUIZZES');// Cambia el titulo por información general.
  hideContent();// Esconde todos los contenidos.
  pQuizzesProgressPage.style.display = 'block';// Muestra el contenido información general.
};

pEjercicios.addEventListener('click', () => {
  ejerciciosAverage(gUsers);
});
function ejerciciosAverage(users) {
  const renderUsers = users.forEach(element => {
    let names = `<tr><td>${element.name}</td><td>${isNaN(element.stats.exercises.percent) ? 0 : element.stats.exercises.percent}%</td></tr>`;
    return infoPEjerciciosTable.innerHTML += names;
  });
  changeTitle('AVANCE DE EJERCICIOS');// Cambia el titulo por información general.
  hideContent();// Esconde todos los contenidos.
  pEjerciciosProgressPage.style.display = 'block';// Muestra el contenido información general.
};

const changeTitle = (titleText) => { // Cambia el titulo del dashboard.
  document.getElementById('titleDashboard').innerText = titleText;
};

function orderNameChange() {// Ordena la grilla general por nombre de estudiante.
  const selectedIndex = document.getElementById('comboBoxOrder').selectedIndex;// Obtiene indice seleccionado.
  const selectedItem = document.getElementById('comboBoxOrder').options[selectedIndex];// Obtiene elemento seleccionado en base a indice.
  sortUsers(gUsers, 'name', selectedItem.value);// Ejecuta function con parametros seleccionados.
  generalInformation(gUsers); // Genera InfoGeneral con parametro gUser.
  resumenCohort(gUsers);// Genera resumenCohort con parametro gUser y lo guarda.
}
function orderAvgChange() {// Ordena la grilla general por promedio de estudiante.
  const selectedIndex = document.getElementById('comboBoxOrderAvg').selectedIndex;
  const selectedItem = document.getElementById('comboBoxOrderAvg').options[selectedIndex];
  sortUsers(gUsers, 'percent', selectedItem.value);
  generalInformation(gUsers);
  resumenCohort(gUsers);
}

function categoryFilter() { //Filtra alumnas por niveles, óptimo, no óptimo, sin avance, Todos.
  const SelectedFilter = document.querySelector('input[name="optradio"]:checked').value;
  switch (SelectedFilter) {
	  case 'Todos':
		  generalInformation(gUsers);
	    break;	  
	  case 'Optimo':
		  let filterUser = gUsers.filter(function(studentFilter) {
	    let averageStudent = Math.round((studentFilter.stats.reads.percent + studentFilter.stats.quizzes.percent + studentFilter.stats.exercises.percent) / 3);
			  return averageStudent >= 70 && averageStudent <= 100;
		  });
		  generalInformation(filterUser);
	    break;
	  case 'NoOptimo':
	    generalInformation(gUsers.filter(function(studentFilter) {
			  let averageStudent = Math.round((studentFilter.stats.reads.percent + studentFilter.stats.quizzes.percent + studentFilter.stats.exercises.percent) / 3);
			  return averageStudent > 0 && averageStudent < 70;
		  }));
	    break;
	  case 'sinAvance':
	    generalInformation(gUsers.filter(function(studentFilter) {
			  let averageStudent = Math.round((studentFilter.stats.reads.percent + studentFilter.stats.quizzes.percent + studentFilter.stats.exercises.percent) / 3);
			  return averageStudent === 0;
		  }));
	    break;
  }
}

function hideContent() {// Oculta contenidos
  const bodyContentChild = document.getElementById('bodyContent').children;
  for (let i = 0;i < bodyContentChild.length;i++) {
    bodyContentChild[i].style.display = 'none';// Los oculta uno a uno.
  }   
};

function cohortsSelectChange(cohort) {// Ejecuta function con parametro cohort que obtiene de combo box.
  getApiData(cohort);// Llama a API con el parametro entregado.
}
