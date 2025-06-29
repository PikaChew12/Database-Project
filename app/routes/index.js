import express from 'express';
import { db } from '../db.js';

const router = express.Router();

/**
 * GET /courses
 * Fetch all courses, ordered by course_id
 */
router.get('/courses', async (req, res) => {
  try {
    const text = `SELECT * FROM course ORDER BY course_id`;
    const { rows } = await db.query(text);
    res.status(200).json(rows);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

/**
 * GET /departments
 * Fetch the list of all department names, alphabetically
 */
router.get('/departments', async (req, res) => {
  try {
    const text = `SELECT dept_name FROM department ORDER BY dept_name`;
    const { rows } = await db.query(text);
    res.status(200).json(rows);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

/**
 * GET /depts/:name
 * Fetch full info for a single department by name
 */
router.get('/depts/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const text = `SELECT * FROM department WHERE dept_name = $1`;
    const { rows } = await db.query(text, [name]);
    res.status(200).json(rows);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

/**
 * GET /students/by-department/:dept
 * Fetch all students in a given department
 */
router.get('/students/by-department/:dept', async (req, res) => {
  try {
    const { dept } = req.params;
    const text = `SELECT * FROM student WHERE dept_name = $1`;
    const { rows } = await db.query(text, [dept]);
    res.status(200).json(rows);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

/**
 * GET /students
 * Fetch all students
 */
router.get('/students', async (req, res) => {
  try {
    const { rows } = await db.query(`SELECT * FROM student`);
    res.status(200).json(rows);
  } catch (err) {
    res
      .status(500)
      .send('Error fetching students: ' + err.message);
  }
});

/**
 * DELETE /students/:id
 * Remove a student record by ID
 */
router.delete('/students/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.query(
      `DELETE FROM student WHERE id = $1`,
      [id]
    );
    res.sendStatus(200);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

/**
 * GET /instructors
 * Fetch all instructors
 */
router.get('/instructors', async (req, res) => {
  try {
    const { rows } = await db.query(`SELECT * FROM instructor`);
    res.status(200).json(rows);
  } catch (err) {
    res
      .status(500)
      .send('Error fetching instructors: ' + err.message);
  }
});

/**
 * GET /courses/:id
 * Fetch a single course by ID, plus list of all departments
 */
router.get('/courses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const courseResult = await db.query(
      `SELECT * FROM course WHERE course_id = $1;`,
      [id]
    );
    const deptsResult = await db.query(
      `SELECT * FROM department;`
    );
    res.status(200).json({
      course: courseResult.rows,
      depts: deptsResult.rows,
    });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

/**
 * POST /courses/save
 * Update an existing course and return updated course list
 */
router.post('/courses/save', async (req, res) => {
  try {
    const { course_id, title, dept_name, credits } = req.body;
    const text = `
      UPDATE course
      SET title = $1,
          dept_name = $2,
          credits = $3
      WHERE course_id = $4
      RETURNING *;
    `;
    await db.query(text, [
      title,
      dept_name,
      credits,
      course_id,
    ]);

    // Return fresh list of courses
    const { rows } = await db.query(
      `SELECT * FROM course ORDER BY course_id`
    );
    res.status(200).json(rows);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

/**
 * POST /students/save
 * Insert a new student record
 */
router.post('/students/save', async (req, res) => {
  try {
    const { id, name, tot_cred, dept_name } = req.body;
    const text = `
      INSERT INTO student
        (id, name, dept_name, tot_cred)
      VALUES ($1, $2, $3, $4)
    `;
    await db.query(text, [id, name, dept_name, tot_cred]);
    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});

/**
 * POST /instructors/save
 * Insert a new instructor record
 */
router.post('/instructors/save', async (req, res) => {
  try {
    const { id, name, dept_name, salary } = req.body;
    const text = `
      INSERT INTO instructor (id, name, dept_name, salary)
      VALUES ($1, $2, $3, $4)
    `;
    await db.query(text, [id, name, dept_name, salary]);
    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});

/**
 * POST /departments/save
 * Insert a new department record
 */
router.post('/departments/save', async (req, res) => {
  try {
    const { dept_name, building, budget } = req.body;
    await db.query(`
      INSERT INTO department (dept_name, building, budget)
      VALUES ($1, $2, $3)
    `, [dept_name, building, budget]);

    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});

/**
 * GET /kpis
 * Compute various KPIs across courses, departments, students, etc.
 */
router.get('/kpis', async (req, res) => {
  try {
    // Basic counts and averages
    const totalCourses = await db.query(
      `SELECT COUNT(*) FROM course`
    );
    const totalDepartments = await db.query(
      `SELECT COUNT(*) FROM department`
    );
    const totalStudents = await db.query(
      `SELECT COUNT(*) AS total_students FROM student`
    );
    const avgCredits = await db.query(
      `SELECT ROUND(AVG(credits), 2) AS avg FROM course`
    );
    const avgCredsPerStudent = await db.query(
      `SELECT ROUND(AVG(tot_cred), 2) AS avg FROM student`
    );

    // Top 5 departments by budget
    const topDepts = await db.query(`
      SELECT dept_name, budget
      FROM department
      ORDER BY budget DESC
      LIMIT 5;
    `);

    // Course distribution by department
    const coursesPerDept = await db.query(`
      SELECT dept_name, COUNT(*) AS num_courses
      FROM course
      GROUP BY dept_name
      ORDER BY num_courses DESC;
    `);

    // Department with most courses
    const mostCoursesDept = await db.query(`
      SELECT dept_name, COUNT(*) AS num_courses
      FROM course
      GROUP BY dept_name
      ORDER BY num_courses DESC
      LIMIT 1;
    `);

    // Department with most distinct students
    const mostStudentsDept = await db.query(`
    SELECT dept_name, COUNT(*) AS student_count
    FROM student
    GROUP BY dept_name
    ORDER BY student_count DESC
    LIMIT 1;
    `);

    // Assemble and send KPI object
    res.json({
      total_courses: totalCourses.rows[0].count,
      total_departments: totalDepartments.rows[0].count,
      total_students: totalStudents.rows[0].total_students,
      average_credits: avgCredits.rows[0].avg,
      avg_credits_per_student: avgCredsPerStudent.rows[0].avg,
      top_departments_by_budget: topDepts.rows,
      course_distribution: coursesPerDept.rows,
      most_courses_dept: mostCoursesDept.rows[0],
      most_students_dept: mostStudentsDept.rows[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to fetch KPIs');
  }
});

export default router;
