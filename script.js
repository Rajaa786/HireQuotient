let users = [];
let tmpUsers = [];
let currentPage = 1;
const rowsPerPage = 10;
let tableBody, searchBox, pageStatus, deleteSelectedBtn, selectAllCheckbox, pagination, dynamic_pagination, selectedCount, totalDataCount, globalDeleteButton, searchBtn;
let originalUserData = {};
let maxPageButtons = 3;
let currPageButtons;


function makeCellEditable(cell, type = 'text', name) {
    const currentValue = cell.textContent;
    cell.innerHTML = `<input type='${type}' name='${name}' value='${escapeHTML(currentValue)}' class='form-control'/>`;
}

function escapeHTML(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function editUser(userid, index) {
    const row = tableBody.rows[index];
    const cells = Array.from(row.cells);

    originalUserData = {
        name: cells[1].textContent,
        email: cells[2].textContent,
        role: cells[3].textContent
    };

    makeCellEditable(cells[1], 'text', 'name'); // Name
    makeCellEditable(cells[2], 'email', 'email'); // Email
    makeCellEditable(cells[3], 'text', 'role'); // Role


    const actionsCell = cells[cells.length - 1];
    actionsCell.innerHTML = `
      <button class='save' onclick='saveUser(${userid}, this.parentElement.parentElement)'>Save</button>
    `;
}


function saveUser(index, row) {
    const inputs = row.querySelectorAll('input');
    const name = inputs[1].value.trim();
    const emailInput = inputs[2];
    const email = emailInput.value.trim();
    const role = inputs[3].value.trim();

    console.log(inputs[1].name, name);
    console.log(inputs[2].name, email);
    console.log(inputs[3].name, role);
    if (!emailInput.checkValidity()) {
        Swal.fire({
            title: 'Error!',
            text: 'Please enter a valid email address.',
            icon: 'error',
            confirmButtonText: 'Ok'
        });
        return;
    }

    Swal.fire({
        title: 'Are you sure?',
        text: "Do you want to save the changes?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, save it!'
    }).then((result) => {
        if (result.isConfirmed) {
            users[index].name = name;
            users[index].email = email;
            users[index].role = role;


            originalUserData = {};

            displayUsers(currentPage);
            setupPagination();

            Swal.fire('Saved!', 'Your changes have been saved.', 'success');
        } else {
            cancelEdit(index);
        }
    });

}

function cancelEdit(index) {
    if (originalUserData.name) {
        users[index] = {
            ...users[index],
            ...originalUserData
        };
        
        tmpUsers[index] = {
            ...tmpUsers[index],
            ...originalUserData
        };
        originalUserData = {};
    }

    displayUsers(currentPage);
}

function displayUsers(page) {
    tableBody.innerHTML = '';
    const start = (page - 1) * rowsPerPage;
    const end = page * rowsPerPage;
    const pageUsers = tmpUsers.slice(start, end);

    pageUsers.forEach((user, index) => {
        const row = tableBody.insertRow();
        row.setAttribute('data-index', index);
        const selectCell = row.insertCell(0);
        const nameCell = row.insertCell(1);
        const emailCell = row.insertCell(2);
        const roleCell = row.insertCell(3);
        const actionsCell = row.insertCell(4);

        selectCell.innerHTML = `<input type='checkbox' class='select-row' data-id='${user.id}'>`;
        nameCell.textContent = user.name;
        emailCell.textContent = user.email;
        roleCell.textContent = user.role;

        const editButton = document.createElement('button');
        editButton.innerHTML = '<i class="fa-regular fa-pen-to-square"></i>';
        editButton.classList.add('edit');

        const deleteButton = document.createElement('button');
        deleteButton.innerHTML = '<i class="fa-solid fa-trash"></i>';
        deleteButton.classList.add('delete');

        actionsCell.appendChild(editButton);
        actionsCell.appendChild(deleteButton);
    });
}

function deleteUser(userId) {

    Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
        if (result.isConfirmed) {
            tmpUsers = users.filter(user => user.id !== userId);
            users = [...tmpUsers];

            displayUsers(currentPage);
            totalDataCount.textContent = users.length;

            Swal.fire(
                'Deleted!',
                'The user has been deleted.',
                'success'
            );
        }
    });
}


function getPageCount() {
    return Math.ceil(tmpUsers.length / rowsPerPage);
}

function updatePagination() {
    const pageCount = getPageCount();
    pageStatus.textContent = `Page ${currentPage} of ${pageCount}`;



    document.querySelectorAll('#pagination-container .page-number').forEach(button => {
        const pageNumber = parseInt(button.textContent, 10);
        if (pageNumber === currentPage) {
            console.log("added active class")
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
}


function handleStartOfPagination(pageCount, currentPage) {
    if (currentPage > (pageCount + 1 - maxPageButtons)) {
        dynamic_pagination.appendChild(createPageButton(1, false));
        dynamic_pagination.appendChild(createPageButton('...', true));
    } else if (currentPage >= maxPageButtons && currentPage <= pageCount + 1 - maxPageButtons) {
        dynamic_pagination.appendChild(createPageButton('...', true));
    }
}

function handleButtonCreation(rangeStart, rangeEnd, currentPage) {
    for (let i = rangeStart; i <= rangeEnd; i++) {
        dynamic_pagination.appendChild(createPageButton(i, false));
    }
}

function handleEndOfPagination(pageCount, currentPage) {
    if (currentPage >= maxPageButtons && currentPage <= pageCount + 1 - maxPageButtons) {
        dynamic_pagination.appendChild(createPageButton('...', true));
    } else if (currentPage < maxPageButtons) {
        dynamic_pagination.appendChild(createPageButton('...', true));
        dynamic_pagination.appendChild(createPageButton(pageCount, false));
    }
}


function formatPagination(rangeStart, rangeEnd, currentPage, pageCount) {

    let isDynamic = pageCount > maxPageButtons;

    if (isDynamic) {
        handleStartOfPagination(pageCount, currentPage);
        handleButtonCreation(rangeStart, rangeEnd, currentPage);
        handleEndOfPagination(pageCount, currentPage);
    } else {
        handleButtonCreation(rangeStart, rangeEnd, currentPage);
    }
}


function setupPagination() {
    const pageCount = getPageCount();
    dynamic_pagination.innerHTML = '';

    currRange = maxPageButtons;

    let rangeStart, rangeEnd;

    if (pageCount <= maxPageButtons) {
        console.log("Inside else if");
        rangeStart = 1;
        rangeEnd = pageCount;
        formatPagination(rangeStart, rangeEnd, currentPage, pageCount);
    } else if (pageCount > maxPageButtons) {
        if (currentPage < maxPageButtons) {
            rangeStart = 1;
            rangeEnd = maxPageButtons - 1;
            formatPagination(rangeStart, rangeEnd, currentPage, pageCount);
        } else if (currentPage > pageCount + 1 - maxPageButtons) {
            rangeStart = pageCount + 2 - maxPageButtons;
            rangeEnd = pageCount;
            formatPagination(rangeStart, rangeEnd, currentPage, pageCount);


        } else if (currentPage >= maxPageButtons && currentPage <= pageCount + 1 - maxPageButtons) {
            currRange = maxPageButtons - 2;
            rangeStart = currentPage - 1;
            rangeEnd = currentPage + 1;
            formatPagination(rangeStart, rangeEnd, currentPage, pageCount);

        } else if (currentPage === (pageCount + 1 - maxPageButtons)) {
            rangeStart = currentPage;
            rangeEnd = currentPage + maxPageButtons - 1;
            formatPagination(rangeStart, rangeEnd, currentPage, pageCount);
        } else if (currentPage === maxPageButtons) {
            rangeStart = currentPage;
            rangeEnd = currentPage + maxPageButtons - 1;
            formatPagination(rangeStart, rangeEnd, currentPage, pageCount);
        }

    }

    // Update the state of arrow buttons
    document.getElementById('prev').disabled = currentPage === 1;
    document.getElementById('next').disabled = currentPage === pageCount;
    document.getElementById('first').disabled = currentPage === 1;
    document.getElementById('last').disabled = currentPage === pageCount;

    updatePagination();
}

function createPageButton(pageNumber, isDisabled) {
    const button = document.createElement('button');
    button.innerText = pageNumber;
    button.className = isDisabled ? 'page-number disabled' : 'page-number';
    // if (!isDisabled) {
    button.addEventListener('click', function () {
        if (pageNumber === '...') return; // Do nothing for ellipsis
        changePage(pageNumber);
    });

    return button;
}

function changePage(targetPage) {
    const pageCount = getPageCount();
    if (targetPage === 'first') currentPage = 1;
    else if (targetPage === 'prev') currentPage = Math.max(1, currentPage - 1);
    else if (targetPage === 'next') currentPage = Math.min(currentPage + 1, pageCount);
    else if (targetPage === 'last') currentPage = pageCount;
    else currentPage = targetPage; 

    displayUsers(currentPage);
    setupPagination();
}




document.addEventListener('DOMContentLoaded', function () {
    const apiUrl = 'https://geektrust.s3-ap-southeast-1.amazonaws.com/adminui-problem/members.json';
    let currentPage = 1;
    tableBody = document.getElementById('table-body');
    searchBox = document.getElementById('search-box');
    pageStatus = document.getElementById('page-status');
    deleteSelectedBtn = document.getElementById('delete-selected');
    pagination = document.getElementById('pagination-container');
    dynamic_pagination = document.getElementById('dynamic-pagination');
    selectedCount = document.getElementById('selectedCount');
    totalDataCount = document.getElementById('totalData');
    searchBtn = document.getElementById('search-btn');


    selectAllCheckbox = document.getElementById('select-all');

    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            users = data;
            tmpUsers = data;
            displayUsers(currentPage);
            setupPagination();
            const pageCount = getPageCount();
            console.log("Current Page Btns ", pageCount);
            totalDataCount.textContent = users.length;
        })
        .catch(error => console.error('Error fetching users:', error));


    tableBody.addEventListener('change', function (event) {
        const target = event.target;
        if (target.tagName.toLowerCase() === 'input' && target.classList.contains('select-row')) {
            if (target.checked) {
                selectedCount.textContent = parseInt(selectedCount.textContent, 10) + 1;
                deleteSelectedBtn.classList.add('active');
            }
        }
    });


    tableBody.addEventListener('click', function (event) {
        let target = event.target;


        if (target.tagName.toLowerCase() === 'i' && (target.parentElement.classList.contains('edit') || target.parentElement.classList.contains('delete'))) {
            target = target.parentElement;
        }

        if (target.tagName.toLowerCase() === 'button' && (target.classList.contains('edit') || target.classList.contains('delete'))) {
            const row = target.closest('tr');
            const curr_index = parseInt(row.getAttribute('data-index'), 10);
            console.log("Current Index ", curr_index);
            const userId = row.querySelector('.select-row').dataset.id;

            if (target.classList.contains('edit')) {
                editUser(userId-1, curr_index);
            } else if (target.classList.contains('delete')) {
                deleteUser(userId);
            }
        }
    });


    selectAllCheckbox.addEventListener('change', function (e) {
        const checkboxes = document.querySelectorAll('#table-body .select-row');
        checkboxes.forEach(checkbox => {
            checkbox.checked = e.target.checked;
        });
        deleteSelectedBtn.classList.toggle('active', e.target.checked);
        selectedCount.textContent = checkboxes.length;
    });


    searchBtn.addEventListener('click', function () {
        const searchTerm = searchBox.value.toLowerCase();
        if (searchTerm === '') {
            return;
        }
        tmpUsers = users.filter(user =>
            user.name.split(' ').some(part => part.toLowerCase().startsWith(searchTerm)) ||
            user.email.toLowerCase().startsWith(searchTerm) ||
            user.role.toLowerCase().startsWith(searchTerm)
        );
        displayUsers(1);
        setupPagination();
    });



    deleteSelectedBtn.addEventListener('click', function () {
        const selectedCheckboxes = document.querySelectorAll('.select-row:checked');
        if (selectedCheckboxes.length === 0) {
            Swal.fire({
                title: 'Error!',
                text: 'Please select at least one user to delete.',
                icon: 'error',
                confirmButtonText: 'Ok'
            });
            return;
        }
        Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
        }).then((result) => {
            if (result.isConfirmed) {
                selectedCheckboxes.forEach(checkbox => {
                    let userId = checkbox.getAttribute('data-id');
                    tmpUsers = users.filter(user => user.id !== userId);
                    users = [...tmpUsers];
                });
                
                displayUsers(currentPage);
                setupPagination();
                totalDataCount.textContent = users.length;
                selectAllCheckbox.checked = false;

                Swal.fire(
                    'Deleted!',
                    'The user has been deleted.',
                    'success'
                );
            }
        });

    });
});