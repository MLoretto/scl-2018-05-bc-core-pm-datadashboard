window.computeUsersStats = (users, progress, courses) => {
  users.forEach(element => {
    let countPart = 0, totalRead = 0, totalQuiz = 0, totalExercise = 0, totalReadOk = 0, totalQuizOk = 0, totalExerciseOk = 0, totalScoreQuiz = 0, scoreSumQuiz = 0, scoreAvgQuiz = 0;
    let userProgress = progress[element.id]; // Obtiene progreso por usuario
    for (var progKey in userProgress) { // Recorre los cursos
      for (var unitKey in userProgress[progKey]) { // Recorre las unidades
        if (unitKey === 'units') {
          for (var unitsInside in userProgress[progKey][unitKey]) { // Obtiene todas las unidades
            for (var groupKey in userProgress[progKey][unitKey][unitsInside]) {
              if (groupKey === 'parts') { // Obtiene el objeto de "Parts"
                for (partKey in userProgress[progKey][unitKey][unitsInside][groupKey]) { // Recorre las "Parts"
                  switch (userProgress[progKey][unitKey][unitsInside][groupKey][partKey].type) { // Elije tipo de parte
                  case 'read':
                    totalRead++; // Sumas una lectura al total
                    countPart++;
                    if (userProgress[progKey][unitKey][unitsInside][groupKey][partKey].completed === 1) {
                      totalReadOk++; // Suma una lectura completada
                      countPart++;
                    };
                  case 'quiz':
                    totalQuiz++;
                    if (userProgress[progKey][unitKey][unitsInside][groupKey][partKey].completed === 1) {
                      totalQuizOk++;						
                      countPart++;
                      let score = userProgress[progKey][unitKey][unitsInside][groupKey][partKey].score;
                      scoreSumQuiz += parseInt(score === undefined ? 0 : score);// Obtiene puntajes de Quizzes
                    };
                  case 'exercise':
                    totalExercise++;// Suma un workshop al total
                    countPart++;
                    if (userProgress[progKey][unitKey][unitsInside][groupKey][partKey].completed === 1) {
                      totalExerciseOk++;// Suma uno a los completados
                      countPart++;
                    };
                  }
                }
              }
            }  
          }
        } 
      }
    }
    let stats = { // Arma un objeto para Users
      parts: countPart,
      percent: Math.round((((totalExerciseOk * 100) / (totalExercise === 0 ? 1 : totalExercise)) + ((totalReadOk * 100) / (totalRead === 0 ? 1 : totalRead)) + ((totalQuizOk * 100) / (totalQuiz === 0 ? 1 : totalQuiz))) / 3),
      exercises: {
        total: Math.round(totalExercise),
        completed: Math.round(totalExerciseOk),
        percent: Math.round((totalExerciseOk * 100) / (totalExercise === 0 ? 1 : totalExercise)) // Cambia los ceros por 1, para evitar division por 0
      },
      reads: {
        total: Math.round(totalRead),
        completed: Math.round(totalReadOk),
        percent: Math.round((totalReadOk * 100) / (totalRead === 0 ? 1 : totalRead))
      },
      quizzes: {
        total: Math.round(totalQuiz),
        completed: Math.round(totalQuizOk),
        percent: Math.round((totalQuizOk * 100) / (totalQuiz === 0 ? 1 : totalQuiz)),
        scoreSum: Math.round(scoreSumQuiz),
        scoreAvg: Math.round(scoreSumQuiz / (totalQuizOk === 0 ? 1 : totalQuizOk))
      },
    };
    element['stats'] = stats;// Agrega la nueva propiedad al Users, si no existiera no se podrían realizar cálculos.
  });
  
  // Ejecuta las funciones que se despliegan en el html.
  lectureProgress(users);
  generalInformation(users);
  resumenCohort(users);
  return users;
};

window.getCohorts = (cohorts) => { // Arma el contenido del desplegable de cohorts.
  const renderCohorts = cohorts.forEach(element => {
    let cohortElement = `<a class="dropdown-item" href="javascript:cohortsSelectChange('${element.id}');">${element.id}</href>`;
    return cohortsList.innerHTML += cohortElement;
  });
  return renderCohorts;
};

window.filterUsers = (users, search) => { // Función de filtro de usuario
  return users.filter(function(studentFilter) { // Retorna los usuarios filtrados a respuesta de filter user.
    return studentFilter.name.toLowerCase().indexOf(search.toLowerCase()) > -1;// Evalua, -1 no lo encuentra. Envia indice de donde encuentra el search.
  });
};

window.sortUsers = (users, orderBy, orderDirection) => {
  let sortedUsers;
  if (orderBy === 'name') {
    if (orderDirection === 'ASC') {
      sortedUsers = users.sort((first, second) => first.name.localeCompare(second.name));
    }
    if (orderDirection === 'DESC') {
      sortedUsers = users.sort((first, second) => first.name.localeCompare(second.name)).reverse();
    }
  };
  if (orderBy === 'percent') {
    if (orderDirection === 'ASC') {
      sortedUsers = users.sort((first, second) => first.stats.percent - second.stats.percent);
    }
    if (orderDirection === 'DESC') {
      sortedUsers = users.sort((first, second) => first.stats.percent - second.stats.percent).reverse();
    }
  };
  if (orderBy === 'exercisesPercent') {
    if (orderDirection === 'ASC') {
      sortedUsers = users.sort((first, second) => first.stats.exercises.percent - second.stats.exercises.percent);
    }
    if (orderDirection === 'DESC') {
      sortedUsers = users.sort((first, second) => first.stats.exercises.percent - second.stats.exercises.percent).reverse();
    }
  };
  if (orderBy === 'quizzesPercent') {
    if (orderDirection === 'ASC') {
      sortedUsers = users.sort((first, second) => first.stats.quizzes.percent - second.stats.quizzes.percent);
    }
    if (orderDirection === 'DESC') {
      sortedUsers = users.sort((first, second) => first.stats.quizzes.percent - second.stats.quizzes.percent).reverse();
    }
  };
  if (orderBy === 'quizzesScorePercent') {
    if (orderDirection === 'ASC') {
      sortedUsers = users.sort((first, second) => first.stats.quizzes.scoreAvg - second.stats.quizzes.scoreAvg);
    }
    if (orderDirection === 'DESC') {
      sortedUsers = users.sort((first, second) => first.stats.quizzes.scoreAvg - second.stats.quizzes.scoreAvg).reverse();
    }
  };
  if (orderBy === 'readsPercent') {
    if (orderDirection === 'ASC') {
      sortedUsers = users.sort((first, second) => first.stats.reads.percent - second.stats.reads.percent);
    }
    if (orderDirection === 'DESC') {
      sortedUsers = users.sort((first, second) => first.stats.reads.percent - second.stats.reads.percent).reverse();
    }
  };
  return sortedUsers;
};

window.processCohortData = (options) => {
  let computeUsers = computeUsersStats(options.cohortData.users, options.cohortData.progress, options.cohortData.courses);
  let sortedUsers = sortUsers(computeUsers, options.orderBy, options.orderDirection);
  let filteredUsers = filterUsers(sortedUsers, options.search);
  console.log('processCohortData result:');
  console.log(filteredUsers);
  return filteredUsers;
};