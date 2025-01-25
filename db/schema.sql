-- Create the database
CREATE DATABASE IF NOT EXISTS zot_gepartner;

-- Use the database
USE zot_gepartner;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    major VARCHAR(100)
);

-- Create past_courses table
CREATE TABLE IF NOT EXISTS past_courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    course_code VARCHAR(20) NOT NULL,
    course_department VARCHAR(100) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create current_classes table
CREATE TABLE IF NOT EXISTS current_classes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    course_code VARCHAR(20) NOT NULL,
    course_department VARCHAR(100) NOT NULL,
    year INT NOT NULL,
    quarter VARCHAR(50) NOT NULL,
    time_slot VARCHAR(50),
    location VARCHAR(100),
    FOREIGN KEY (user_id) REFERENCES users(id)
);
