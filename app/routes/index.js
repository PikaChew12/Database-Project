import express, { query } from "express";
const router = express.Router();
import { db } from "../db.js";


router.get('/courses', async (req, res) => {
    try {
        const query = `SELECT * FROM course ORDER BY course_id`;
        const { rows } = await db.query(query);
        res.status(200).json(rows);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

router.get('/departments', async (req, res) => {
    try {
        const query = `select dept_name from department order by dept_name`;
        const { rows } = await db.query(query);
        res.status(200).json(rows);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

router.get('/depts/:name', async (req, res) => {
    try {
        const { name } = req.params;
        const query = `SELECT * FROM department WHERE dept_name = $1`;
        const { rows } = await db.query(query, [name]);
        res.status(200).json(rows);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

router.get('/students/by-department/:dept', async (req, res) => {
    try {
        const { dept } = req.params;
        const query = `SELECT * FROM student WHERE dept_name = $1`;
        const { rows } = await db.query(query, [dept]);
        res.status(200).json(rows);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

router.delete('/students/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await db.query(`DELETE FROM student WHERE id = $1`, [id]);
        res.sendStatus(200);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

router.get('/courses/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const course = await db.query(`SELECT * FROM course WHERE course_id = $1;`, [id]);
        const depts = await db.query(`SELECT * FROM department;`);
        res.status(200).json({ course: course.rows, depts: depts.rows });
    } catch (err) { res.status(500).send(err.message); }
});

router.post('/courses/save', async (req, res) => {
    console.log(req.body)
    try {
        const { course_id, title, dept_name, credits } = req.body
        const query = `UPDATE course SET title = $1, dept_name = $2, credits  = $3 WHERE course_id = $4 RETURNING *;`
        const result = await db.query(query, [title, dept_name, credits, course_id]);
        const { rows } = await db.query(`SELECT * FROM course ORDER BY course_id`);
        res.status(200).json(rows);
    } catch (err) { res.status(500).send(err.message); }
});

router.post('/students/save', async (req, res) => {
    try {
        const { id, name, tot_cred, dept_name } = req.body;
        await db.query(
            `INSERT INTO student (id, name, dept_name, tot_cred) VALUES ($1, $2, $3, $4)`,
            [id, name, dept_name, tot_cred]
        );
        res.sendStatus(200);
    } catch (err) {
        console.error(err);
        res.status(500).send(err.message);
    }
});

router.get('/students', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM student');
    res.status(200).json(rows);
  } catch (err) {
    res.status(500).send('Error fetching students: ' + err.message);
  }
});

router.get('/instructors', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM instructor');
    res.status(200).json(rows);
  } catch (err) {
    res.status(500).send('Error fetching instructors: ' + err.message);
  }
});
router.get('/kpis', async (req, res) => {
    try {
        const totalCourses = await db.query(`SELECT COUNT(*) FROM course`);
        const totalDepartments = await db.query(`SELECT COUNT(*) FROM department`);
        const totalStudents = await db.query(`SELECT COUNT(*) AS total_students FROM student`);
        const avgCredits = await db.query(`SELECT ROUND(AVG(credits), 2) AS avg FROM course`);
        const avgCredsPerStudent = await db.query(`SELECT ROUND(AVG(tot_cred), 2) AS avg FROM student`);
        const topCourseLoads = await db.query(`
            SELECT course_id, COUNT(*) AS student_count
            FROM takes
            GROUP BY course_id
            ORDER BY student_count DESC
            LIMIT 5;
        `);
        const topDepts = await db.query(`
            SELECT dept_name, budget
            FROM department
            ORDER BY budget DESC
            LIMIT 5;
        `);
        const coursesPerDept = await db.query(`
            SELECT dept_name, COUNT(*) AS num_courses
            FROM course
            GROUP BY dept_name
            ORDER BY num_courses DESC;
        `);
        const mostCoursesDept = await db.query(`
            SELECT dept_name, COUNT(*) AS num_courses
            FROM course
            GROUP BY dept_name
            ORDER BY num_courses DESC
            LIMIT 1;
        `);
        const mostStudentsDept = await db.query(`
            SELECT c.dept_name, COUNT(DISTINCT t.id) AS student_count
            FROM course c
            JOIN takes t ON c.course_id = t.course_id
            GROUP BY c.dept_name
            ORDER BY student_count DESC
            LIMIT 1;
        `);

        res.json({
            total_courses: totalCourses.rows[0].count,
            total_departments: totalDepartments.rows[0].count,
            total_students: totalStudents.rows[0].total_students,
            average_credits: avgCredits.rows[0].avg,
            avg_credits_per_student: avgCredsPerStudent.rows[0].avg,
            top_courses_by_enrollment: topCourseLoads.rows,
            top_departments_by_budget: topDepts.rows,
            course_distribution: coursesPerDept.rows,
            most_courses_dept: mostCoursesDept.rows[0],
            most_students_dept: mostStudentsDept.rows[0]
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Failed to fetch KPIs");
    }
});


export default router;


