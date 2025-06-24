function App() {
    return {
        kpis: {},
        page: 1,
        courses: [],
        dept: {},
        course: {},
        depts: [],
        students: [], 
        newStudent: { id: '', name: '', tot_cred: '', dept_name: '' },
        selectedDeptForRemoval: '',
        studentsToRemove: [],
        electedStudent: null,
        selectedDeptInfo: null,

        async getDepartments() {
            try {
                const res = await fetch('/api/departments');
                this.depts = await res.json();
            } catch (err) {
                console.error('Failed to fetch departments:', err);
            }
        },


        async getDeptInfo(deptName) {
            try {
                const res = await fetch(`/api/depts/${deptName}`);
                const data = await res.json();
                this.selectedDeptInfo = data[0];
            } catch (err) {
                console.error("Failed to load department info:", err);
            }
        },

        openRemoveStudent() {
            this.page = 5;
            this.selectedDeptForRemoval = '';
            this.studentsToRemove = [];
            this.selectedStudent = null;

            if (this.depts.length === 0) {
                fetch('/api/departments')
                    .then(res => res.json())
                    .then(data => {
                        this.depts = data;
                    });
            }
        },
        
        async loadStudentsByDept() {
            if (!this.selectedDeptForRemoval) return;

            const res = await fetch(`/api/students/by-department/${this.selectedDeptForRemoval}`);
            this.studentsToRemove = await res.json();
            this.selectedStudent = null;
        },

    selectStudentToRemove(student) {
        this.selectedStudent = student;
    },

    async confirmRemoveStudent() {
        try {
            const res = await fetch(`/api/students/${this.selectedStudent.id}`, {
                method: 'DELETE'
            });

            if (!res.ok) throw new Error(await res.text());

            this.page = 1;
            this.getCourses(); // optional refresh
        } catch (err) {
            alert("Error: " + err.message);
        }
    },

        openAddStudent() {
            this.newStudent = { id: '', name: '', tot_cred: '', dept_name: '' };
            this.page = 4;

            fetch('/api/departments')
                .then(res => res.json())
                .then(data => {
                    this.depts = data;
                });
        },

        async saveStudent() {
            try {
                const res = await fetch('/api/students/save', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(this.newStudent)
                });

                if (!res.ok) throw new Error(await res.text());

                this.page = 1;
                this.getCourses(); // refresh dashboard
            } catch (err) {
                alert("Error: " + err.message);
            }
        },


        async getKpis() {
            try {
                const res = await fetch('/api/kpis');
                this.kpis = await res.json();
            } catch (err) {
                console.error("Failed to load KPIs:", err);
            }
        },
        async getCourses() {
            const courses = (await fetch(`/api/courses`).then(res => res.json()));
            console.log(courses);
            this.courses = courses;
        },
        async getDept(dept_name) {
            console.log(dept_name);
            const dept = (await fetch(`/api/depts/${dept_name}`).then(res => res.json()));
            console.log(dept[0]);
            this.dept = dept[0];

        },
        async Edit(course_id) {
            console.log(course_id);
            const { course, depts } = (await fetch(`/api/courses/${course_id}`).then(res => res.json()));
            this.page = 2;
            console.log(course[0], depts)
            this.course = course[0]
            this.depts = depts;
        },
        async Save() {
            fetch(`/api/courses/save`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(this.course),
            }).then(res => res.json())
            .then(data => {
                console.log(data);
                this.courses = data;
                this.page = 1;
                //this.getCourses()
            });
        },
        async getStudentsByDept(dept_name) {
            try {
                const res = await fetch(`/api/students/by-department/${dept_name}`);
                this.students = await res.json();
                this.page = 3;
            } catch (err) {
                console.error("Error fetching students by department:", err);
            }
        }
    }
}