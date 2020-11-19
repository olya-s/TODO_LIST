async function onPageLoaded() {
  let todosList = [];
  let tasksList = [];
  let token = localStorage.token;
  let userId = localStorage.id;

  const newTodo = document.querySelector('.add-todo-btn');
  const container = document.querySelector('.container');

  const now = new Date();
  const date = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;

  if (!token) {
    createAuthForm(container);
  }
  else {
    createLogoutButton(container);

    getTodos(userId);
    newTodo.style.visibility = 'visible';
  }

  function createAuthForm(container) {
    const authForm = document.createElement('div');
    authForm.classList.add('auth-form');
    const inputsForm = document.createElement('div');
    inputsForm.classList.add('inputs-form');

    const loginInput = document.createElement('input');
    loginInput.type = 'text';
    loginInput.classList.add('input-login');
    loginInput.placeholder = 'username';
    const passwordInput = document.createElement('input');
    passwordInput.type = 'password';
    passwordInput.classList.add('input-password');
    passwordInput.placeholder = 'password';
    inputsForm.append(loginInput, passwordInput);

    const loginButton = document.createElement('button');
    loginButton.classList.add('login-btn');
    loginButton.textContent = 'Login';
    const p = document.createElement('p');
    p.classList.add('error');

    authForm.append(inputsForm, loginButton, p);
    container.appendChild(authForm);

    async function auth(e) {
      const username = loginInput.value;
      const password = passwordInput.value;
      if (!!username && !!password) {
        const auth = await request('/authenticate', 'POST', { username, password });
        if (auth.message) {
          p.style.display = 'block';
          p.textContent = auth.message;
          loginInput.value = '';
          passwordInput.value = '';
        }
        else {
          //-----------------------------------localStorage---------
          localStorage.token = auth.token;
          localStorage.id = auth.id;
          token = localStorage.token;
          userId = localStorage.id;
          authForm.style.display = 'none';
          createLogoutButton(container);
          getTodos(userId);
          newTodo.style.visibility = 'visible';
        }
      }
    }

    passwordInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        auth(e);
      }
    })

    loginButton.addEventListener('click', e => auth(e));

    assignEventHandlersForm(loginInput);
    assignEventHandlersForm(passwordInput);

    function assignEventHandlersForm(elem) {
      elem.addEventListener('focus', e => {
        p.textContent = '';
        p.style.display = 'none';
      })
    }
  }

  function createLogoutButton(container) {
    const logout = document.createElement('button');
    logout.classList.add('login-btn');
    logout.textContent = 'Logout';
    container.prepend(logout);

    logout.addEventListener('click', () => {
      localStorage.clear();
      todosList = [];
      tasksList = [];
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
      createAuthForm(container);
      newTodo.style.visibility = 'hidden';
    })
  }

  async function getTodos(id) {
    todos = await request(`/todo/${id}`);
    todosList = todos.todos;
    tasksList = todos.tasks;

    for (let i = 0; i < todosList.length; i++) {
      const todo = todosList[i];
      createTodo(todo, tasksList);
    }
  }

  newTodo.addEventListener('click', async () => {
    const newTodo = await request(`/todo/${userId}`, 'POST', { title: 'New TODO List' });
    if (newTodo) {
      todosList.push(newTodo);
      createTodo(newTodo);
    }
  });

  function createTodo(todo, tasks) {
    const todoElem = document.createElement('div');
    todoElem.classList.add('todo');
    todoElem.dataset.id = todo.id;

    const heading = document.createElement('div');
    heading.classList.add('row', 'heading');

    const row = document.createElement('div');
    row.classList.add('row');
    const todoIcon = document.createElement('i');
    todoIcon.classList.add('icon', 'notepad', 'far', 'fa-list-alt');
    const header = document.createElement('h2');
    header.textContent = todo.title;
    row.append(todoIcon, header);

    const icons = document.createElement('span');
    icons.classList.add('icons');
    const pencilIcon = document.createElement('i');
    pencilIcon.id = 'pencil';
    pencilIcon.classList.add('icon', 'fas', 'fa-pencil-alt');
    const trashIcon = document.createElement('i');
    trashIcon.id = 'trash';
    trashIcon.classList.add('icon', 'fas', 'fa-trash-alt');
    icons.append(pencilIcon, trashIcon);

    heading.append(row, icons);

    const inputRow = document.createElement('div');
    inputRow.classList.add('row', 'add-task-row');

    const wrapper = document.createElement('div');
    wrapper.classList.add('icon-plus-wrapper');
    const plusIcon = document.createElement('span');
    plusIcon.classList.add('icon-plus');
    wrapper.appendChild(plusIcon);

    const inputField = document.createElement('div');
    inputField.classList.add('input-field');
    const input = document.createElement('input');
    input.classList.add('add-task-input');
    input.type = 'text';
    input.placeholder = 'Start typing here to create a task';
    const button = document.createElement('button');
    button.classList.add('add-task-btn');
    button.textContent = 'Add Task';
    const inputDate = document.createElement('input');
    inputDate.className = 'task-deadline';
    inputDate.type = 'date';
    inputDate.value = date;
    inputDate.min = date;
    inputField.append(input, button, inputDate);

    inputRow.append(wrapper, inputField);

    const ul = document.createElement('ul');
    ul.classList.add('todos');

    todoElem.append(heading, inputRow, ul);
    container.appendChild(todoElem);

    assignEventHandlers(todoElem);

    if (tasks) {
      const todoTasks = tasks.filter(task => task.todoId === todo.id)
        .sort((task1, task2) => task1.ordinal > task2.ordinal ? 1 : -1);
      todoTasks.map(task => createTask(task));
    }
  }

  function assignEventHandlers(todo) {
    const h2 = todo.querySelector('h2');
    const tasks = Array.prototype.slice.call(todo.querySelectorAll('.task-text'));
    const inputDate = todo.querySelector('.task-deadline');

    todo.addEventListener('click', async (e) => {
      const elem = e.target;
      const todoElem = e.currentTarget;
      const todoElemId = todoElem.dataset.id;
      if (elem.classList.contains('add-task-btn')) {
        const input = todo.querySelector('.add-task-input');
        if (!!input.value) {
          const newTask = await request(
            `/task/${todoElemId}`,
            'POST',
            { text: input.value, date: inputDate.value }
          );
          tasksList.push(newTask);
          createTask(newTask);
          input.value = '';
          inputDate.style.display = 'none';
        }
      }
      else if (elem.classList.contains('icon-plus-wrapper') || elem.classList.contains('icon-plus')) {
        todo.querySelector('.add-task-input').focus();
      }
      else if (elem.id === 'pencil') {
        h2.contentEditable = true;
        h2.focus();
      }
      else if (elem.id === 'trash') {
        await request(`/todo/${todoElemId}`, 'DELETE');
        todoElem.remove();
      }
      else if (elem.classList.contains('fa-pencil-alt')) {
        const task = elem.closest('li').querySelector('.task-text');
        task.contentEditable = true;
        task.focus();
      }
      else if (elem.classList.contains('fa-trash-alt') || elem.classList.contains('task-trash')) {
        const task = elem.closest('li');
        const taskId = task.dataset.id;
        await request(`/task/${taskId}`, 'DELETE');
        task.remove();
      }
      else if (elem.classList.contains('arrow-up-wrapper') || elem.classList.contains('arrow-up')) {
        const firstTaskElem = elem.closest('li');
        const secondTaskElem = elem.closest('li').previousElementSibling;
        replaceTasks(firstTaskElem, secondTaskElem);
      }
      else if (elem.classList.contains('arrow-down-wrapper') || elem.classList.contains('arrow-down')) {
        const firstTaskElem = elem.closest('li').nextElementSibling;
        const secondTaskElem = elem.closest('li');
        replaceTasks(firstTaskElem, secondTaskElem);
      }

      async function replaceTasks(firstTaskElem, secondTaskElem) {
        const firstTaskElemId = +firstTaskElem.dataset.id;
        const secondTaskElemId = +secondTaskElem.dataset.id;
        const firstTask = tasksList.find(t => t.id === firstTaskElemId);
        const secondTask = tasksList.find(t => t.id === secondTaskElemId);
        if (!!firstTaskElem) {
          let buf = firstTaskElem.dataset.ordinal;
          firstTaskElem.dataset.ordinal = secondTaskElem.dataset.ordinal;
          secondTaskElem.dataset.ordinal = buf;
          const cloneFirstTaskElem = firstTaskElem.cloneNode(true);
          const cloneSecondTaskElem = secondTaskElem.cloneNode(true);
          const parentElement = firstTaskElem.parentElement;
          parentElement.replaceChild(cloneFirstTaskElem, secondTaskElem);
          parentElement.replaceChild(cloneSecondTaskElem, firstTaskElem);
          await request(`/task/${firstTaskElemId}`, 'PUT', { ...firstTask, ordinal: firstTaskElem.dataset.ordinal });
          await request(`/task/${secondTaskElemId}`, 'PUT', { ...secondTask, ordinal: secondTaskElem.dataset.ordinal });
        }
      }

    });

    todo.addEventListener('keypress', async (e) => {
      const elem = e.target;
      const todoElem = e.currentTarget;
      const keyEnter = 13;
      if (elem.classList.contains('add-task-input')) {
        inputDate.style.display = 'block';
      }
      if (e.keyCode === keyEnter) {
        if (elem.tagName === 'H2' || elem.classList.contains('task-text')) {
          elem.blur();
        }
        else if (elem.classList.contains('add-task-input')) {
          if (!!elem.value) {
            const newTask = await request(
              `/task/${todoElem.dataset.id}`,
              'POST',
              { text: elem.value, date: inputDate.value }
            );
            if (newTask) {
              tasksList.push(newTask);
              createTask(newTask);
              elem.value = '';
              elem.blur();
              inputDate.style.display = 'none';
            }
          }
        }
      }
    });

    todo.addEventListener('focusout', async (e) => {
      const elem = e.target;
      const text = elem.textContent;
      if (elem.tagName === 'H2') {
        const todoListId = e.currentTarget.dataset.id;
        const todoList = todosList.find(t => t.id === todoListId);
        await request(`/todo/${todoListId}`, 'PUT', { ...todoList, title: text });
        elem.contentEditable = false;
      }
      else if (elem.classList.contains('task-text')) {
        const taskId = elem.parentElement.parentElement.dataset.id;
        const task = tasksList.find(t => t.id === taskId);
        await request(`/task/${taskId}`, 'PUT', { ...task, text });
        elem.contentEditable = false;
      }
    });
  }

  function createTask(newTask) {
    if (!!newTask) {
      const todo = document.querySelector(`div[data-id='${newTask.todoId}']`);
      const ul = todo.querySelector('.todos');
      const li = document.createElement('li');
      li.classList.add('list-item');
      li.dataset.id = newTask.id;

      const label = document.createElement('label');
      const checkboxSpan = document.createElement('span');
      checkboxSpan.classList.add('checkbox');
      const checkboxInput = document.createElement('input');
      checkboxInput.type = 'checkbox';
      checkboxInput.checked = newTask.marked;
      checkboxSpan.appendChild(checkboxInput);

      const textSpan = document.createElement('span');
      textSpan.classList.add('task-text');
      textSpan.tabIndex = '-1';
      textSpan.append(newTask.text);
      label.append(checkboxSpan, textSpan);

      const iconsSpan = document.createElement('span');
      iconsSpan.classList.add('icons');

      const movingSpan = document.createElement('span');
      movingSpan.classList.add('icon', 'task-moving');

      const arrowUpSpan = document.createElement('span');
      arrowUpSpan.classList.add('arrow-wrapper', 'arrow-up-wrapper');
      const arrowUp = document.createElement('i');
      arrowUp.classList.add('arrow-up');
      arrowUpSpan.appendChild(arrowUp);

      const separator = document.createElement('span');
      separator.classList.add('separator');

      const arrowDownSpan = document.createElement('span');
      arrowDownSpan.classList.add('arrow-wrapper', 'arrow-down-wrapper');
      const arrowDown = document.createElement('i');
      arrowDown.classList.add('arrow-down');
      arrowDownSpan.appendChild(arrowDown);

      movingSpan.append(arrowUpSpan, separator, arrowDownSpan);

      const editSpan = document.createElement('span');
      editSpan.classList.add('icon', 'task-edit');
      const editIcon = document.createElement('i');
      editIcon.classList.add('fas', 'fa-pencil-alt');
      editSpan.appendChild(editIcon);

      const trashSpan = document.createElement('span');
      trashSpan.classList.add('icon', 'task-trash');
      const trashIcon = document.createElement('i');
      trashIcon.classList.add('fas', 'fa-trash-alt');
      trashSpan.appendChild(trashIcon);

      iconsSpan.append(movingSpan, editSpan, trashSpan);

      ul.appendChild(li).append(label, iconsSpan);

      checkboxInput.addEventListener('change', async (e) => {
        const elem = e.target;
        const taskId = +elem.closest('.list-item').dataset.id;
        const task = tasksList.find(t => t.id === taskId);
        task.marked = !task.marked;
        await request(`/task/${taskId}`, 'PUT', { ...task, marked: elem.checked });
      })
    }
  }

  async function request(url, method = 'GET', data = null) {
    const headers = {};
    let body;
    if (localStorage.token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (data) {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify({ ...data });
    }
    try {
      const response = await fetch(url, {
        method,
        headers,
        body
      });
      return await response.json();
    } catch (e) {
      console.warn('Error:', e.message);
    }
  }
}

document.addEventListener('DOMContentLoaded', onPageLoaded);