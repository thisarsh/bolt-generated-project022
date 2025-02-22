document.addEventListener('DOMContentLoaded', () => {
  const subjectForm = document.getElementById('subject-form');
  const subjectsBody = document.querySelector('#subjects tbody');
  const attendanceSummaryBody = document.querySelector('#attendance-summary tbody');
  const subjectDetailSection = document.getElementById('subject-detail');
  const attendanceHistoryBody = document.querySelector('#attendance-history tbody');
  const detailSubjectNameSpan = document.getElementById('detail-subject-name');

  let subjects = JSON.parse(localStorage.getItem('subjects')) || [];
  let selectedSubjectName = null;

  // Calendar Elements
  const calendarDaysContainer = document.getElementById('calendar-days');
  const currentMonthSpan = document.getElementById('current-month');
  const prevMonthButton = document.getElementById('prev-month');
  const nextMonthButton = document.getElementById('next-month');
  const dayDetailsPopup = document.getElementById('day-details-popup');
  const popupDateTitle = document.getElementById('popup-date');
  const popupClassesList = document.getElementById('popup-classes');

  let currentDate = new Date();

  function renderCalendar() {
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const startDayOfWeek = firstDayOfMonth.getDay();

    currentMonthSpan.textContent = `${getMonthName(currentDate.getMonth())} ${currentDate.getFullYear()}`;
    calendarDaysContainer.innerHTML = '';

    for (let i = 0; i < startDayOfWeek; i++) {
      const emptyDay = document.createElement('div');
      emptyDay.classList.add('day', 'empty');
      calendarDaysContainer.appendChild(emptyDay);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dayElement = document.createElement('div');
      dayElement.classList.add('day');
      dayElement.textContent = day;
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      dayElement.addEventListener('click', () => showDayDetails(date));

      if (isToday(date)) {
        dayElement.classList.add('today');
      }
      if (hasClassesOnDay(date)) {
        const indicator = document.createElement('span');
        indicator.classList.add('day-indicator');
        dayElement.appendChild(indicator);
      }

      calendarDaysContainer.appendChild(dayElement);
    }
  }

  function showDayDetails(date) {
    popupDateTitle.textContent = date.toDateString();
    popupClassesList.innerHTML = ''; // Clear previous classes
    const formattedDate = formatDate(date);
    console.log('showDayDetails Date:', formattedDate); // DEBUG

    subjects.forEach(subject => {
      const classItem = document.createElement('div');
      classItem.classList.add('popup-class-item');
      classItem.innerHTML = `<span>${subject.name}</span>`;

      const attendanceStatus = subject.attendance[formattedDate]?.[subject.name] || 'none'; // Get status for subject
      const statusDisplay = document.createElement('span');
      statusDisplay.textContent = attendanceStatus === 'none' ? 'Not Marked' : attendanceStatus.charAt(0).toUpperCase() + attendanceStatus.slice(1);
      classItem.appendChild(statusDisplay);

      const presentButton = document.createElement('button');
      presentButton.textContent = 'Present';
      presentButton.onclick = () => markCalendarAttendance(subject.name, 'present', formattedDate);
      const absentButton = document.createElement('button');
      absentButton.textContent = 'Absent';
      absentButton.onclick = () => markCalendarAttendance(subject.name, 'absent', formattedDate);

      classItem.appendChild(presentButton);
      classItem.appendChild(absentButton);
      popupClassesList.appendChild(classItem);
    });

    dayDetailsPopup.style.display = 'flex'; // Show popup
  }

  function hideDayDetails() {
    dayDetailsPopup.style.display = 'none';
    renderCalendar();
    renderAttendanceSummary();
    renderSubjects();
  }
  window.hideDayDetails = hideDayDetails;

  function markCalendarAttendance(subjectName, status, date) {
    console.log('markCalendarAttendance called with:', subjectName, status, date); // DEBUG
    const subjectIndex = subjects.findIndex(subject => subject.name === subjectName);
    if (subjectIndex !== -1) {
      const attendanceForDate = subjects[subjectIndex].attendance[date] || {}; // Get existing attendance for the date or create new
      attendanceForDate[subjectName] = status; // Set attendance for the specific subject
      subjects[subjectIndex].attendance[date] = attendanceForDate; // Update attendance for the date
      localStorage.setItem('subjects', JSON.stringify(subjects));
      showDayDetails(new Date(date)); // Re-render popup to update status
      renderCalendar();
      renderAttendanceSummary();
      renderSubjects();
    } else {
      console.log('Subject not found:', subjectName); // DEBUG
    }
  }


  function hasClassesOnDay(date) {
    // Example: Weekdays have classes
    const dayOfWeek = date.getDay();
    return dayOfWeek >= 1 && dayOfWeek <= 5;
  }

  function getMonthName(monthIndex) {
    const monthNames = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    return monthNames[monthIndex];
  }

  function isToday(date) {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  }
  function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }


  prevMonthButton.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
  });

  nextMonthButton.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
  });


  // Render Subjects Table
  function renderSubjects() {
    subjectsBody.innerHTML = '';
    subjects.forEach((subject, index) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td><a href="#" onclick="showSubjectDetail('${subject.name}')">${subject.name}</a></td>
        <td>${subject.minAttendance}%</td>
        <td>
          <button onclick="markAttendance('${subject.name}', 'present')">Present</button>
          <button onclick="markAttendance('${subject.name}', 'absent')">Absent</button>
        </td>
        <td>
          <button onclick="deleteSubject(${index})">Delete</button>
        </td>
      `;
      subjectsBody.appendChild(row);
    });
    renderAttendanceSummary();
    renderCalendar();
  }

  // Render Attendance Summary
  function renderAttendanceSummary() {
    attendanceSummaryBody.innerHTML = '';
    subjects.forEach((subject) => {
      let presentCount = 0;
      let absentCount = 0;
      for (const date in subject.attendance) {
        const dailyAttendance = subject.attendance[date];
        if (dailyAttendance && dailyAttendance[subject.name] === 'present') {
          presentCount++;
        } else if (dailyAttendance && dailyAttendance[subject.name] === 'absent') {
          absentCount++;
        }
      }
      const totalClasses = presentCount + absentCount;
      const percentage = totalClasses > 0 ? ((presentCount / totalClasses) * 100).toFixed(2) : 0;
      const row = document.createElement('tr');

      const minAttendancePercentage = parseFloat(subject.minAttendance);

      if (percentage < minAttendancePercentage) {
        row.classList.add('low-attendance');
      } else if (percentage >= 90) {
        row.classList.add('very-high-attendance');
      } else if (percentage >= 75) {
        row.classList.add('high-attendance');
      } else {
        row.classList.add('medium-attendance');
      }


      row.innerHTML = `
        <td>${subject.name}</td>
        <td>${totalClasses}</td>
        <td>${presentCount}</td>
        <td>${absentCount}</td>
        <td>${percentage}% ${percentage < minAttendancePercentage ? '⚠️' : ''}</td>
      `;
      attendanceSummaryBody.appendChild(row);
    });
  }

  // Add Subject
  subjectForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const subjectName = document.getElementById('subject-name').value;
    const minAttendance = document.getElementById('min-attendance').value;

    subjects.push({
      name: subjectName,
      minAttendance: minAttendance,
      attendance: {} // Attendance is now an object/map, date -> {subjectName: status, ...}
    });

    localStorage.setItem('subjects', JSON.stringify(subjects));
    renderSubjects();
    subjectForm.reset();
  });

  // Mark Attendance (from subject table - keeping for now, might remove later)
  window.markAttendance = (subjectName, status) => {
    const subjectIndex = subjects.findIndex(subject => subject.name === subjectName);
    if (subjectIndex !== -1) {
      const todayFormatted = formatDate(new Date());
      let dailyAttendance = subjects[subjectIndex].attendance[todayFormatted] || {};
      dailyAttendance[subjectName] = status;
      subjects[subjectIndex].attendance[todayFormatted] = dailyAttendance;

      localStorage.setItem('subjects', JSON.stringify(subjects));
      renderSubjects();
      if (selectedSubjectName === subjectName) {
        renderSubjectDetail(subjectName);
      }
    }
  };

  // Delete Subject
  window.deleteSubject = (index) => {
    if (confirm('Are you sure you want to delete this subject?')) {
      subjects.splice(index, 1);
      localStorage.setItem('subjects', JSON.stringify(subjects));
      renderSubjects();
      hideSubjectDetail();
    }
  };

  // Show Subject Detail
  window.showSubjectDetail = (subjectName) => {
    selectedSubjectName = subjectName;
    detailSubjectNameSpan.textContent = subjectName;
    renderSubjectDetail(subjectName);
    subjectDetailSection.style.display = 'block';
  };

  // Hide Subject Detail
  window.hideSubjectDetail = () => {
    subjectDetailSection.style.display = 'none';
    selectedSubjectName = null;
  };

  // Render Subject Detail
  function renderSubjectDetail(subjectName) {
    attendanceHistoryBody.innerHTML = '';
    const subject = subjects.find(subject => subject.name === subjectName);
    if (subject) {
      for (const date in subject.attendance) {
        const dailyAttendance = subject.attendance[date];
        const status = dailyAttendance[subjectName] || 'none';
        if (status !== 'none') { // Only show records where attendance is marked for this subject
          const row = document.createElement('tr');
          const displayDate = new Date(date).toLocaleDateString();
          row.innerHTML = `
            <td>${displayDate}</td>
            <td>${status}</td>
            <td>
              <button onclick="removeAttendanceRecord('${subjectName}', '${date}')">Remove</button>
            </td>
          `;
          attendanceHistoryBody.appendChild(row);
        }
      }
    }
  }

  // Remove Attendance Record
  window.removeAttendanceRecord = (subjectName, dateToRemove) => {
    if (confirm('Are you sure you want to remove this attendance record for ${subjectName} on ${dateToRemove}?')) {
      const subjectIndex = subjects.findIndex(subject => subject.name === subjectName);
      if (subjectIndex !== -1) {
        const dailyAttendance = subjects[subjectIndex].attendance[dateToRemove];
        if (dailyAttendance) {
          delete dailyAttendance[subjectName]; // Remove attendance for the subject on that date
          if (Object.keys(dailyAttendance).length === 0) {
            delete subjects[subjectIndex].attendance[dateToRemove]; // If no more subjects for that date, remove the date entry
          } else {
            subjects[subjectIndex].attendance[dateToRemove] = dailyAttendance; // Update with remaining subjects
          }


          localStorage.setItem('subjects', JSON.stringify(subjects));
          renderSubjectDetail(subjectName);
          renderAttendanceSummary();
          renderCalendar();
        }
      }
    }
  };

  // Initial Render
  renderSubjects();
  renderCalendar();
});
