# CELTECH Digital Library

**BSIT 3A Final Project**

A web-based library reservation and inventory management system for CELTECH College Olongapo.

## Project Status

✅ Development Milestone Completed

## Main Features

- Student and Teacher Book Catalog
- Book Reservation System
- Admin Dashboard
- Book Inventory and Restocking
- Reservation Management
- Borrowing and Return Monitoring
- Pickup scheduling, due-date reminders, and overdue tracking
- Borrower return scheduling with Admin confirmation
- Penalty resolution and borrowing activity history
- Admin settings for borrowing rules and return notifications
- Browser-local student registration, account-name management, and password settings

## Technologies Used

- HTML
- CSS
- JavaScript
- PHP
- LocalStorage

## Developer

Developed by: mlmesiano/thea project idea manager 

## Project Note

This repository contains the project source code and its development files.

**Milestone:** November 17, 2026

## Demo Accounts and Storage

The login page includes static demo accounts (IDs `202411059` for Student, `202411060` for Teacher, and `202411061` for Admin); each initially uses password `password`. Student registrations, account-name overrides, and password changes are saved in that browser profile's localStorage. They are not written back to the JavaScript source or automatically shared across other browser profiles or devices; anyone using the same profile and site origin sees the same stored accounts. Client-side role checks and password values are demo-only and are not secure authorization or credential storage. A shared deployment should move authentication and account management to a server-side database such as PHP with SQLite, enforce roles on the server, and store passwords using secure password hashing.
 



 open code on github

 https://miserable-spooky-hex-69pr6jjqgj59hx4jw-8000.app.github.dev/

 or 
 php -S 0.0.0.0:8000