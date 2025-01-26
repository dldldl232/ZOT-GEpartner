const express = require('express');
const router = express.Router();
const db = require('../config/db');
const axios = require('axios');

// Helper function to convert term for the `/grades` endpoint
function convertTermForGrades(term) {
    const [year, quarter] = term.split(" ");
    const startYear = parseInt(year);
    const endYear = startYear + 1;
    return `${startYear}-${endYear}`;
}

router.post('/:userId/past-courses', (req, res) => {
    const { userId } = req.params;
    const { course_code, course_department } = req.body;

    const sql = `
        INSERT INTO past_courses (user_id, course_code, course_department)
        VALUES (?, ?, ?)
    `;
    db.query(sql, [userId, course_code, course_department], (err, result) => {
        if (err) return res.status(500).send('Database error');
        res.send('Past course added successfully');
    });
})

// Add a current class
router.post('/:userId/current-classes', (req, res) => {
    const { userId } = req.params;
    const { course_code, course_department, year, quarter, time_slot, location } = req.body;

    const sql = `
        INSERT INTO current_classes (user_id, course_code, course_department, year, quarter, time_slot, location)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    db.query(sql, [userId, course_code, course_department, year, quarter, time_slot, location], (err, result) => {
        if (err) return res.status(500).send('Database error');
        res.send('Current class added successfully');
    });
});

// Retrieve current classes
router.get('/:userId/current-classes', (req, res) => {
    const { userId } = req.params;

    const sql = `
        SELECT * FROM current_classes WHERE user_id = ?
    `;
    db.query(sql, [userId], (err, results) => {
        if (err) return res.status(500).send('Database error');
        res.json(results);
    });
});

// Get recommendations from PeterPortal
// router.post('/:userId/recommendations', async (req, res) => {
//     const { userId } = req.params;
//     const { term, geCategory, desired_time } = req.body;

//     // Validate the `term` parameter
//     const validTerms = ['Fall', 'Winter', 'Spring', 'Summer1', 'Summer2', 'Summer10wk'];
//     const [year, season] = term.split(' ');

//     if (!validTerms.includes(season) || isNaN(parseInt(year))) {
//         return res.status(400).send('Invalid term format. Example: "2025 Winter".');
//     }

//     // Parse desired_time into days and time range
//     const [days, timeRange] = desired_time.split(' ');
//     const [startTime, endTime] = timeRange.split('-');

//     const sql = `
//         SELECT course_code, course_department FROM past_courses WHERE user_id = ?
//         UNION
//         SELECT course_code, course_department FROM current_classes WHERE user_id = ?
//     `;

//     db.query(sql, [userId, userId], async (err, takenCourses) => {
//         if (err) return res.status(500).send('Database error');

//         try {
//             const response = await axios.get(`https://api.peterportal.org/rest/v0/schedule/soc`, {
//                 params: {
//                     term,
//                     ge: geCategory,
//                     days,
//                     startTime: `${startTime.toUpperCase()}M`, // Convert to proper 12-hour format
//                     endTime: `${endTime.toUpperCase()}M`,
//                 },
//             });

//             let geCourses = response.data.schools.flatMap(school =>
//                 school.departments.flatMap(department => department.courses)
//             );

//             // Filter out courses the user has already taken
//             geCourses = geCourses.filter(course => {
//                 return !takenCourses.some(
//                     taken =>
//                         taken.course_code === course.courseNumber &&
//                         taken.course_department === course.deptCode
//                 );
//             });

//             // Filter courses by desired time slot
//             // geCourses = geCourses.filter(course => {
//             //     return course.sections.some(section =>
//             //         section.meetings.some(meeting => meeting.time.trim() === desired_time)
//             //     );
//             // });

//             // Sort courses by GPA in descending order
//             geCourses.sort((a, b) => (b.averageGPA || 0) - (a.averageGPA || 0));

//             // Return only relevant fields
//             const filteredCourses = geCourses.map(course => ({
//                 courseNumber: course.courseNumber,
//                 courseTitle: course.courseTitle,
//                 instructors: course.sections.flatMap(section => section.instructors),
//                 time: course.sections.flatMap(section =>
//                     section.meetings.map(meeting => ({
//                         days: meeting.days,
//                         time: meeting.time,
//                     }))
//                 ),
//                 averageGPA: course.averageGPA,
//             }));

//             res.json(filteredCourses);
//         } catch (apiError) {
//             console.error('Error fetching courses from PeterPortal:', apiError);
//             res.status(500).send('Failed to fetch GE courses');
//         }
//     });
// });

router.post("/:userId/recommendations", async (req, res) => {
    const { userId } = req.params;
    const { term, desired_time } = req.body;

    try {
        // Validate term parameter
        const [year, quarter] = term.split(" ");
        const validQuarters = ["Fall", "Winter", "Spring", "Summer1", "Summer2", "Summer10wk"];
        if (!validQuarters.includes(quarter) || isNaN(parseInt(year))) {
            return res.status(400).json({ error: "Invalid term format. Example: '2025 Winter'." });
        }

        // Parse desired_time into days and time range
        const [days, timeRange] = desired_time.split(" ");
        const [startTime, endTime] = timeRange.split("-").map((time) => time.trim() + "AM");

        // Step 1: Retrieve taken and current courses for the user
        const sql = `
            SELECT course_code, course_department FROM past_courses WHERE user_id = ?
            UNION
            SELECT course_code, course_department FROM current_classes WHERE user_id = ?
        `;
        const [takenCourses] = await db.promise().query(sql, [userId, userId]);

        // Step 2: Fetch available courses from the `/schedule/soc` endpoint
        const scheduleResponse = await axios.get("https://api.peterportal.org/rest/v0/schedule/soc", {
            params: {
                term: `${year} ${quarter}`,
                days,
                startTime,
                endTime,
            },
        });

        const courses = scheduleResponse.data.schools.flatMap((school) =>
            school.departments.flatMap((department) =>
                department.courses.map((course) => ({
                    courseNumber: course.courseNumber,
                    courseTitle: course.courseTitle,
                    department: course.deptCode,
                    sections: course.sections,
                }))
            )
        );

        // Step 3: Filter out courses the user has already taken
        const availableCourses = courses.filter(
            (course) =>
                !takenCourses.some(
                    (taken) =>
                        taken.course_code === course.courseNumber &&
                        taken.course_department === course.department
                )
        );

        // Step 4: Fetch GPA data for each course
        const coursesWithGPA = await Promise.all(
            availableCourses.map(async (course) => {
                try {
                    const gradesResponse = await axios.get("https://api.peterportal.org/rest/v0/grades/raw", {
                        params: {
                            department: course.department,
                            number: course.courseNumber,
                        },
                    });

                    const averageGPA =
                        gradesResponse.data.reduce((sum, entry) => sum + (entry.averageGPA || 0), 0) /
                            gradesResponse.data.length || null;

                    return { ...course, averageGPA };
                } catch {
                    return { ...course, averageGPA: null }; // Handle GPA fetch errors gracefully
                }
            })
        );

        // Step 5: Sort courses by desired time slot first, then by highest average GPA
        const sortedCourses = coursesWithGPA.sort((a, b) => {
            const aTime = a.sections[0]?.meetings[0]?.time || "";
            const bTime = b.sections[0]?.meetings[0]?.time || "";
            if (aTime.localeCompare(bTime) === 0) {
                return (b.averageGPA || 0) - (a.averageGPA || 0);
            }
            return aTime.localeCompare(bTime);
        });

        // Step 6: Format and return the recommendations
        const recommendations = sortedCourses.map((course) => ({
            courseNumber: course.courseNumber,
            courseTitle: course.courseTitle,
            averageGPA: course.averageGPA,
            instructors: course.sections.flatMap((section) => section.instructors),
            time: course.sections.flatMap((section) =>
                section.meetings.map((meeting) => ({
                    days: meeting.days,
                    time: meeting.time,
                }))
            ),
        }));

        res.status(200).json(recommendations);
    } catch (error) {
        console.error("Error generating recommendations:", error.message);
        res.status(500).json({ error: "An error occurred while generating recommendations." });
    }
});

module.exports = router;// Add a current class
router.post('/:userId/current-classes', (req, res) => {
    const { userId } = req.params;
    const { course_code, course_department, year, quarter, time_slot, location } = req.body;

    const sql = `
        INSERT INTO current_classes (user_id, course_code, course_department, year, quarter, time_slot, location)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    db.query(sql, [userId, course_code, course_department, year, quarter, time_slot, location], (err, result) => {
        if (err) return res.status(500).send('Database error');
        res.send('Current class added successfully');
    });
});

// Retrieve current classes
router.get('/:userId/current-classes', (req, res) => {
    const { userId } = req.params;

    const sql = `
        SELECT * FROM current_classes WHERE user_id = ?
    `;
    db.query(sql, [userId], (err, results) => {
        if (err) return res.status(500).send('Database error');
        res.json(results);
    });
});

module.exports = router;
