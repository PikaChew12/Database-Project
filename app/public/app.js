function App() {
    return {
        // ===== Application State =====
        kpis: {},                             // Dashboard key performance indicators
        page: 1,                              // Current page/view index
        courses: [],                          // List of all courses
        dept: {},                             // Single department detail
        course: {},                           // Course being edited
        depts: [],                            // List of department names
        students: [],                         // Students filtered by department (for dept view)
        newStudent: {                         // Model for the “Add Student” form
            id: '',
            name: '',
            tot_cred: '',
            dept_name: ''
        },
        selectedDeptForRemoval: '',           // Dept name chosen in “Remove Student” flow
        studentsToRemove: [],                 // List of students in the selected dept for removal
        selectedStudent: null,                // Student object chosen to delete
        selectedDeptInfo: null,               // Full info for a single department detail view
        instructors: [],                      // List of all instructors
        allstudents: [],                      // Full list of students (for standalone Students table)
        newInstructor: {
            id: '',
            name: '',
            dept_name: '',
            salary: ''
        },

        // ===== Data Fetching Methods =====

        /** Fetch and store all instructors */
        async getInstructors() {
            const instructors = await fetch('/api/instructors')
                .then(res => res.json());
            this.instructors = instructors;
        },

        /** Fetch and store all students for the Students table */
        async getStudents() {
            const students = await fetch('/api/students')
                .then(res => res.json());
            this.allstudents = students;
        },

        /** Fetch and store list of department names */
        async getDepartments() {
            try {
                const res = await fetch('/api/departments');
                this.depts = await res.json();
            } catch (err) {
                console.error('Failed to fetch departments:', err);
            }
        },

        /** Fetch and store full info for one department */
        async getDeptInfo(deptName) {
            try {
                const res = await fetch(`/api/depts/${deptName}`);
                const data = await res.json();
                this.selectedDeptInfo = data[0];
            } catch (err) {
                console.error("Failed to load department info:", err);
            }
        },

        // ===== Remove Student Flow =====

        /** Initialize “Remove Student” page and load departments if needed */
        openRemoveStudent() {
            this.page = 5;
            this.selectedDeptForRemoval = '';
            this.studentsToRemove = [];
            this.selectedStudent = null;

            // Lazy-load departments
            if (this.depts.length === 0) {
                fetch('/api/departments')
                    .then(res => res.json())
                    .then(data => {
                        this.depts = data;
                    });
            }
        },

        /** Fetch students for the selected department to remove */
        async loadStudentsByDept() {
            if (!this.selectedDeptForRemoval) return;

            const res = await fetch(
                `/api/students/by-department/${this.selectedDeptForRemoval}`
            );
            this.studentsToRemove = await res.json();
            this.selectedStudent = null;  // Reset any prior selection
        },

        /** Mark a student object for removal */
        selectStudentToRemove(student) {
            this.selectedStudent = student;
        },

        /** Send DELETE request for the selected student and return to dashboard */
        async confirmRemoveStudent() {
            try {
                const res = await fetch(
                    `/api/students/${this.selectedStudent.id}`,
                    { method: 'DELETE' }
                );

                if (!res.ok) throw new Error(await res.text());

                this.page = 1;
                this.getCourses(); // Refresh dashboard if desired
            } catch (err) {
                alert("Error: " + err.message);
            }
        },

        // ===== Add Student Flow =====

        /** Open “Add Student” page and reset form model */
        openAddStudent() {
            this.newStudent = { id: '', name: '', tot_cred: '', dept_name: '' };
            this.page = 4;

            // Load department list for form dropdown
            fetch('/api/departments')
                .then(res => res.json())
                .then(data => {
                    this.depts = data;
                });
        },

        /** POST a new student record, then return to dashboard */
        async saveStudent() {
            try {
                const res = await fetch('/api/students/save', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(this.newStudent)
                });

                if (!res.ok) throw new Error(await res.text());

                this.page = 1;
                this.getCourses(); // Refresh KPI/dashboard
            } catch (err) {
                alert("Error: " + err.message);
            }
        },

        openAddInstructor() {
        this.newInstructor = { id: '', name: '', dept_name: '', salary: '' };
        this.page = 6;

        // Ensure departments are loaded
        if (this.depts.length === 0) {
            fetch('/api/departments')
            .then(res => res.json())
            .then(data => this.depts = data);
        }
        },

        async saveInstructor() {
        try {
            const res = await fetch('/api/instructors/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(this.newInstructor)
            });

            if (!res.ok) throw new Error(await res.text());

            this.page = 1;
            this.getInstructors(); // Refresh instructor table
        } catch (err) {
            alert("Error: " + err.message);
        }
        },

        // ===== Dashboard Data Methods =====

        /** Fetch and store KPIs for the dashboard */
        async getKpis() {
            try {
                const res = await fetch('/api/kpis');
                this.kpis = await res.json();
            } catch (err) {
                console.error("Failed to load KPIs:", err);
            }
        },

        /** Fetch and store all courses */
        async getCourses() {
            const courses = await fetch(`/api/courses`)
                .then(res => res.json());
            console.log(courses);
            this.courses = courses;
        },

        // ===== Department Detail View =====

        /** Fetch and store simple dept info into `dept` */
        async getDept(dept_name) {
            console.log(dept_name);
            const dept = await fetch(`/api/depts/${dept_name}`)
                .then(res => res.json());
            console.log(dept[0]);
            this.dept = dept[0];
        },

        // ===== Course Edit Flow =====

        /** Load a single course & departments, then open edit page */
        async Edit(course_id) {
            console.log(course_id);
            const { course, depts } = await fetch(
                `/api/courses/${course_id}`
            ).then(res => res.json());

            this.page = 2;               // Switch to edit view
            console.log(course[0], depts);
            this.course = course[0];     // Populate form model
            this.depts = depts;          // Populate dept dropdown
        },

        /** POST edited course back to server and refresh list */
        async Save() {
            fetch(`/api/courses/save`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(this.course),
            })
            .then(res => res.json())
            .then(data => {
                console.log(data);
                this.courses = data;     // Update courses list
                this.page = 1;           // Return to dashboard
            });
        },

        // ===== Department-Filtered Students View =====

        /**
         * Fetch students for a clicked department,
         * then switch to the dept-students page
         */
        async getStudentsByDept(dept_name) {
            try {
                const res = await fetch(
                    `/api/students/by-department/${dept_name}`
                );
                this.students = await res.json();
                this.page = 3;
            } catch (err) {
                console.error("Error fetching students by department:", err);
            }
        }
    }
}
