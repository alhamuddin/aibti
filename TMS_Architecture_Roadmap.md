# Training Management System - Architecture and Delivery Roadmap

Converted from `TMS_Architecture_Roadmap.pdf` (68 pages). Page breaks are preserved for reference.

## Contents
- [Page 1](#page-1)
- [Page 2](#page-2)
- [Page 3](#page-3)
- [Page 4](#page-4)
- [Page 5](#page-5)
- [Page 6](#page-6)
- [Page 7](#page-7)
- [Page 8](#page-8)
- [Page 9](#page-9)
- [Page 10](#page-10)
- [Page 11](#page-11)
- [Page 12](#page-12)
- [Page 13](#page-13)
- [Page 14](#page-14)
- [Page 15](#page-15)
- [Page 16](#page-16)
- [Page 17](#page-17)
- [Page 18](#page-18)
- [Page 19](#page-19)
- [Page 20](#page-20)
- [Page 21](#page-21)
- [Page 22](#page-22)
- [Page 23](#page-23)
- [Page 24](#page-24)
- [Page 25](#page-25)
- [Page 26](#page-26)
- [Page 27](#page-27)
- [Page 28](#page-28)
- [Page 29](#page-29)
- [Page 30](#page-30)
- [Page 31](#page-31)
- [Page 32](#page-32)
- [Page 33](#page-33)
- [Page 34](#page-34)
- [Page 35](#page-35)
- [Page 36](#page-36)
- [Page 37](#page-37)
- [Page 38](#page-38)
- [Page 39](#page-39)
- [Page 40](#page-40)
- [Page 41](#page-41)
- [Page 42](#page-42)
- [Page 43](#page-43)
- [Page 44](#page-44)
- [Page 45](#page-45)
- [Page 46](#page-46)
- [Page 47](#page-47)
- [Page 48](#page-48)
- [Page 49](#page-49)
- [Page 50](#page-50)
- [Page 51](#page-51)
- [Page 52](#page-52)
- [Page 53](#page-53)
- [Page 54](#page-54)
- [Page 55](#page-55)
- [Page 56](#page-56)
- [Page 57](#page-57)
- [Page 58](#page-58)
- [Page 59](#page-59)
- [Page 60](#page-60)
- [Page 61](#page-61)
- [Page 62](#page-62)
- [Page 63](#page-63)
- [Page 64](#page-64)
- [Page 65](#page-65)
- [Page 66](#page-66)
- [Page 67](#page-67)
- [Page 68](#page-68)

## Page 1

ENTERPRISE ARCHITECTURE  |  SYSTEM DESIGN  |  DELIVERY ROADMAP
Training
Management
System
A complete blueprint for an industry-grade training institute
platform serving 10,000 employees
Next.js
Prisma
PostgreSQL
Better Auth
Tailwind CSS
Version 1.0   |   October 2026   |   Confidential - Internal use

## Page 2

Contents
Navigate by chapter; bookmarks are also in your PDF reader's sidebar
 .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  . 5
i About this book
  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  . 5
Who should read which part
  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  . 5
Decisions already made
 .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  . 6
1 Executive summary
  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  . 6
Vision
  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  . 6
Business objectives
  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  . 6
Scope
  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  . 7
Success metrics
 .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  . 8
2 Requirements
  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  . 8
Users and roles
  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  . 8
Feature map and priority (MoSCoW)
  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  . 9
Non-functional requirements
  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  . 9
Capacity planning assumptions
 .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  . 10
3 System architecture
  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  . 10
Architecture principles
  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  . 10
System context
  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  . 11
Layered design
  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  . 12
Module map
  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  . 12
Technology stack
  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  . 13
Deployment topology
  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  . 13
Hosting options
  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  . 14
Architecture decision records
 .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  . 15
4 Domain and data model
  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  . 15
Core entity relationships
  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  . 16
Extended entities
  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  . 16
Modelling conventions
  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  . 17
Integrity constraints and indexes
  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  . 17
Capacity enforcement without over-booking
  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  . 18
Data lifecycle
  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  . 18
Schema evolution policy
 .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  . 19
5 Identity and authorisation
Training Management System  |  Architecture & Delivery Roadmap
Contents
Confidential - Internal use
2

## Page 3

.  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  . 19
Account lifecycle
  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  . 19
Better Auth configuration
  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  . 20
Password and session policy
  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  . 20
Four layers of authorisation
  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  . 21
Role permissions (Better Auth access control)
  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  . 21
Permission matrix
  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  . 22
Resource policies and data scoping
 .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  . 23
6 Core workflows
  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  . 23
Enrolment (admin-driven)
  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  . 24
Attendance: QR, code and manual
  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  . 26
Batch finalisation and certificates
  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  . 26
Mandatory training by rule
  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  . 28
Speaker evaluation
  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  . 28
Learn in the branch (cascade)
  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  . 29
Notifications
  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  . 29
Secure file upload and download
 .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  . 31
7 UX and UI design
  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  . 31
Information architecture
  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  . 31
Design principles
  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  . 32
Design system
  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  . 32
Accessibility and localisation
  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  . 33
Reference screens
 .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  . 40
8 Application engineering
  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  . 40
Repository structure
  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  . 40
Engineering rules
  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  . 41
Server Action template
  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  . 41
Background jobs
  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  . 42
Performance practice
 .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  . 43
9 Reporting and analytics
  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  . 43
Report catalogue
  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  . 44
How 'how long ago' is defined
  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  . 44
Report UX and delivery rules
 .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  . 45
10 Security and privacy
  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  . 45
Threat model
  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  . 46
Security headers
  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  . 46
Rate limiting
  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  . 46
Privacy and data protection
  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  . 46
Secure development lifecycle
Training Management System  |  Architecture & Delivery Roadmap
Contents
Confidential - Internal use
3

## Page 4

.  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  . 47
11 DevOps and reliability
  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  . 47
Delivery pipeline
  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  . 48
Environments
  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  . 48
Observability
  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  . 48
Service-level objectives and alerts
  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  . 49
Backup and disaster recovery
  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  . 49
Container and health check
  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  . 49
Operational runbooks to write before go-live
 .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  . 50
12 Quality engineering
  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  . 51
Authorisation matrix test (pattern)
  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  . 51
Quality gates (a merge or release is blocked unless all pass)
  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  . 51
Test data
 .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  . 52
13 Delivery roadmap
  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  . 52
Eighteen-week plan
  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  . 53
Team
  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  . 53
Risk register
  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  . 54
Definition of done
  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  . 54
Go-live checklist
  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  . 54
Rollout and change management
  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  . 54
After launch: next releases
 .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  . 55
A Prisma schema
 .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  . 64
B Raw SQL migration
 .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  . 65
C Environment variables
 .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  . 66
D Best-practice checklist
 .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  . 67
E Glossary
 .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  . 68
F References and inspiration
  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  . 68
Official documentation
  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  . 68
Products worth studying for UX ideas
Training Management System  |  Architecture & Delivery Roadmap
Contents
Confidential - Internal use
4

## Page 5

i
About this book
How to read and use this blueprint
This book is a complete, build-ready blueprint for a Training Management System (TMS) for a
company of about 10,000 employees. It turns the original idea (training schedules, participant records,
study materials, e-mail invitations, speaker evaluation and learn-in-the-branch cascading) into an
enterprise-grade product: architecture, data model, security, workflows, UI design, operations, testing
and a week-by-week delivery roadmap.
Who should read which part
 Reader
Start with
Why
Sponsor / training head
Ch. 1, 2, 13
Scope, outcomes, timeline, risks and the go-live plan
Solution architect / tech lead
Ch. 3, 4, 5, 8, 10
Architecture, data model, security, engineering
conventions
Developers
Ch. 4, 5, 6, 8, Appendix A-B
Schema, workflows, code patterns, ready-to-run SQL
UI / UX designer
Ch. 7
Sitemap, design system, 12 reference screens
DevOps / QA
Ch. 11, 12
Pipeline, observability, backup, test strategy
Decisions already made
 Topic
Decision
Consequence
Organisation
Single company (no multi-tenancy)
Simpler schema and security; no tenant id on every table
Attendance
Both self check-in and trainer-marked
QR / code check-in plus roster; manual overrides audited
Enrolment
Admin enrols participants
Participants confirm or decline; no self-enrol or approval
chain
Delivery
Onsite and online
Sessions carry their own mode, venue and meeting link
Mandatory training
Rule-based assignment
Rules by branch, department, designation, grade, join
date
Authentication
E-mail and password
Admin-created accounts; strong policy; 2FA for admins
CORRECTION
Three corrections to the schema from the earlier draft. (1) The training session model clashed with Better Auth's
Session model, so it is now TrainingSession. (2) The raw SQL constraints used snake_case column names, but
Prisma creates camelCase columns unless mapped, so the SQL in Appendix B uses quoted camelCase names. (3)
The venue overlap constraint uses tsrange, because Prisma DateTime columns are timestamp without time zone
(stored as UTC). The corrected schema is also supplied as a separate schema.prisma file.
WATCH OUT
Library APIs move quickly (Next.js, Better Auth, Prisma). Treat code snippets as patterns, and check each against the
current official documentation when you implement it. Pin exact versions in your lockfile.
Training Management System  |  Architecture & Delivery Roadmap
About this book
Confidential - Internal use
5

## Page 6

1
Executive summary
Vision, scope and measurable success
Today, training in a 10,000-person company usually lives in spreadsheets, e-mail chains and paper
attendance sheets. That makes it hard to answer basic questions: Who attended what? How long
ago? Who is overdue for mandatory training? Did the branch actually pass the knowledge on? The
TMS replaces that with a single, auditable system of record.
Vision
One trusted source of truth for every training event, every participant and every outcome, with enough
automation (invitations, reminders, compliance tracking, certificates) that the training centre spends its time on
training, not administration.
Business objectives
 - Visibility: instantly answer who has attended which training, when, with what result, and who has not.
- Compliance: mandatory training assigned by rule, tracked to completion, renewed before expiry, with
exemptions on record.
- Efficiency: cut manual scheduling, invitation and attendance effort by eliminating spreadsheets and paper.
- Quality: measure speaker and course quality through anonymous, statistically meaningful evaluation.
- Knowledge multiplication: make learn-in-the-branch cascading verifiable, with branch-level evidence and
approval.
- Audit readiness: every important change is logged; every certificate can be verified publicly.
Scope
 In scope (v1)
Later phases
Out of scope
Employee and organisation master data; admin-created
accounts; course catalogue; batches and sessions;
admin enrolment; waitlist; onsite/online delivery; QR,
code and manual attendance; certificates; materials;
mandatory-training rules; speaker and course evaluation;
cascade reporting; reports; audit log; e-mail and in-app
notifications; English and Bangla UI
Quizzes and assessments; budget
and cost tracking; training-needs
requests; SSO; Zoom/Meet/Teams
attendance webhooks; PWA offline
check-in; skills matrix and career
paths
Full LMS content authoring
(SCORM hosting); payroll;
recruitment; external learners;
multi-company tenancy
Training Management System  |  Architecture & Delivery Roadmap
Executive summary
Confidential - Internal use
6

## Page 7

Success metrics
 Metric
Target
How it is measured
Time to find an employee's complete training
history
< 10 seconds
Transcript page load plus search
Manual attendance effort per batch
-70 % vs. today
Time study at pilot branches
Mandatory-training compliance visibility
Real-time, by branch
Compliance dashboard freshness (nightly at
worst)
Invitation delivery success
> 98 % delivered
E-mail provider delivery and bounce metrics
Cascade reports submitted on time
> 85 %
Cascade dashboard
Evaluation response rate
> 70 %
Responses / completed enrolments
System availability (business hours)
99.9 %
Uptime monitor and SLO dashboard
User satisfaction (admins and participants)
≥ 4.2 / 5
Pulse survey 60 days after go-live
Training Management System  |  Architecture & Delivery Roadmap
Executive summary
Confidential - Internal use
7

## Page 8

2
Requirements
Users, features and non-functional targets
Users and roles
 Role
Typical person
Primary goals
Admin (training centre)
Training officers, head of training
Plan batches, enrol people, manage rules, run reports, resolve
exceptions
Teacher / trainer
Internal faculty, guest speakers
See assigned batches, open check-in, mark attendance, upload
materials, read own feedback
Participant
Any employee (~10,000)
See invitations, confirm or decline, check in, learn, evaluate,
report cascade, download transcript
Branch manager
Branch head / regional lead
See branch training status, review cascade reports, track
compliance (read-only)
Auditor (optional)
Internal audit
Read-only access to reports and audit log
BEST PRACTICE
A teacher is almost always also an employee who attends other trainings. Do not model that as two separate accounts.
Use one account, a role that grants capability, and relationship checks (is this person a trainer on this batch?) for each
record.
Feature map and priority (MoSCoW)
 Module
Key capabilities
Priority
Phase
Identity and access
Admin-created accounts, forced first-login password change, roles,
lockout, 2FA for admins, audit
Must
1
Organisation data
Branches (tree), departments, designations with grade, employees,
CSV/Excel bulk import with error report
Must
1
Catalogue
Courses, categories, prerequisites, validity and renewal, pass rules
Must
2
Scheduling
Batches, multi-session, trainers, venues, conflict prevention, calendar
Must
2
Enrolment
Admin enrol, capacity, waitlist, confirm/decline, .ics invites, reminders
Must
3
Attendance
QR and code self check-in, roster marking, overrides, finalisation
Must
4
Certificates
Unique numbers, PDF, public QR verification, expiry and revocation
Must
4
Materials
Upload, virus scan, versioning, access rules, signed downloads
Must
5
Mandatory training
Rule builder, nightly evaluation, overdue and renewal, exemptions
Must
6
Speaker evaluation
Templates, windows, anonymity threshold, trends
Must
7
Learn-in-the-branch
Task, sessions, attendees, evidence, review workflow, escalation
Must
7
Reports
Transcript, participation, not-trained-since, compliance, trainer
scorecards, exports
Must
8
Notifications
E-mail queue with retries, in-app inbox, templates, preferences
Must
3
Training Management System  |  Architecture & Delivery Roadmap
Requirements
Confidential - Internal use
8

## Page 9

Module
Key capabilities
Priority
Phase
Localisation
English and Bangla UI, Asia/Dhaka display time
Should
1-9
Quizzes and
assessments
Pre/post tests, question bank, pass marks
Could
Later
Cost and budget
Per-batch cost, budget vs. actual, cost per participant
Could
Later
SSO
OIDC / SAML via Better Auth plugins
Could
Later
Webhooks
Zoom / Meet / Teams join-log import for online attendance
Could
Later
Non-functional requirements
 Area
Requirement
Target
Performance
Server response, typical page / API (p95)
< 500 ms / < 300 ms
Burst
Check-in burst at session start
500 check-ins in 60 s, p99 < 1 s
Availability
Business hours (07:00-21:00 Asia/Dhaka)
99.9 % monthly
Recovery
Recovery point / time objective
RPO ≤ 15 min, RTO ≤ 4 h
Scalability
Employees, enrolments over 10 years
10 k employees, > 2 M enrolments
Security
Baseline
OWASP ASVS Level 2, annual
penetration test
Accessibility
Conformance
WCAG 2.2 AA; keyboard and
screen-reader support
Compatibility
Browsers and devices
Last 2 versions of Chrome, Edge,
Firefox, Safari; mobile-first
Auditability
Retention of audit log
7 years (configurable by policy)
Localisation
Languages and time
English and Bangla; UTC storage,
Asia/Dhaka display
Maintainability
Quality gates
Strict TypeScript, ≥ 80 % coverage on
core modules, zero critical
vulnerabilities
Capacity planning assumptions
These are planning assumptions to validate with real numbers from the training centre. They show that the data
volume is modest for PostgreSQL, and that the real engineering effort goes into correctness, security and
workflow, not raw scale.
Quantity
Assumption
Yearly volume
Enrolments
10,000 employees x ~4 trainings
~40,000 rows
Attendance records
Average 5 sessions per enrolment
~200,000 rows
E-mails
~10 messages per enrolment lifecycle
~400,000 messages
Cascade evidence
10,000 tasks x 3 photos x 1.5 MB
~45 GB object storage
Training materials
500 courses x ~50 MB
~25 GB object storage
Audit log
~15 events per enrolment plus admin actions
~1 M rows
Training Management System  |  Architecture & Delivery Roadmap
Requirements
Confidential - Internal use
9

## Page 10

3
System architecture
A modular monolith built for clarity, security and operability
Architecture principles
 - Modular monolith first. One deployable with strict module boundaries. At 10,000 users, microservices add cost
without benefit; clean modules keep the option open.
- Boring, proven technology. PostgreSQL as the system of record; no extra datastore unless a measured need
appears.
- Secure by default. Deny by default, validate every input, scope every query, log every sensitive action.
- Twelve-factor operation. Configuration from environment, stateless app containers, disposable processes, logs
to stdout.
- Idempotent, observable jobs. Every background job can be retried safely and reports its outcome.
- Time is UTC. Store UTC, render in Asia/Dhaka, never mix.
- History must not change. Enrolments snapshot branch, department and designation at the time of training.
System context
Admin
Training centre staff:
plans, enrols, reports
Teacher / Trainer
 Delivers sessions,
marks attendance
Participant
Employee: learns,
checks in, evaluates
Branch manager
 Reads branch status,
 reviews cascade
TRAINING MANAGEMENT
 SYSTEM
Next.js modular monolith
Identity & access
Organisation
Catalogue & scheduling
Enrolment
Attendance & certificates
Materials
Compliance rules
Evaluation
Learn-in-branch
Reports & audit
Notifications & jobs
Email provider
 SES / Resend
Object storage
 S3-compatible
HR system
CSV / API import
Zoom / Meet / Teams
 Phase 2 webhooks
Sentry + logs
 Monitoring
 Figure 1. System context. Four user groups interact with the TMS; it integrates with e-mail, object storage, the HR system and
 monitoring.
Training Management System  |  Architecture & Delivery Roadmap
System architecture
Confidential - Internal use
10

## Page 11

Layered design
Every request travels the same path. Server Actions and Route Handlers are thin: they authenticate, validate and
delegate. Business rules and transactions live in the service layer. The policy layer decides whether an action is
allowed and which rows are visible. Only repositories talk to Prisma.
Browser: Next.js App Router (React Server Components) · Tailwind CSS · shadcn/ui · React Hook Form + Zod · TanStack Table
Edge: CDN · WAF · TLS 1.2+ · rate limiting · security headers (CSP, HSTS)
NEXT.JS APPLICATION (single deployable, modular monolith)
Route groups
/admin /teacher /me /verify
Better Auth handler
 /api/auth/*
Server Actions + Route Handlers
thin: parse, validate (Zod), delegate
POLICY LAYER: can(user, action, resource) + scoped query builders (branch / trainer / owner)
SERVICE LAYER: domain modules (identity · org · catalog · batches · enrolment · attendance · compliance · evaluation · cascade · reports) - business rules,
 transactions, domain events
DATA ACCESS: repositories on Prisma Client · typed raw SQL for reports · migrations
PostgreSQL 16
(system of record)
Object storage
(files, exports)
pg-boss workers
(jobs, emails, cron)
Email provider
+ ClamAV scanner
 Figure 2. Layered architecture from browser to data stores. Policy and data scoping sit between the service layer and the repositories.
Training Management System  |  Architecture & Delivery Roadmap
System architecture
Confidential - Internal use
11

## Page 12

Module map
 TIER 1 · FOUNDATION
identity
org
audit
notifications
storage
depends on (one direction only)
TIER 2 · PLANNING
catalog
batches
materials
depends on (one direction only)
TIER 3 · DELIVERY
enrolment
attendance
evaluation
cascade
depends on (one direction only)
TIER 4 · GOVERNANCE
compliance
reports
Rule: a module exposes a service interface and domain events. It never reads another module's tables directly.
 Figure 3. Thirteen domain modules with explicit dependencies. Cross-module calls go through each module's public service interface
 only.
Technology stack
 Concern
Choice
Notes
Web framework
Next.js (App Router), React, TypeScript strict
Server Components for read-heavy pages; Server
Actions for mutations
Styling / UI
Tailwind CSS, shadcn/ui, Radix primitives, lucide
icons
Design tokens in CSS variables; dark mode ready
Forms / validation
React Hook Form with Zod (shared schemas)
One schema validates client and server
Data tables
TanStack Table with server-side pagination
Never load 10,000 rows into the browser
ORM / database
Prisma, PostgreSQL (current stable)
Extensions: citext, pg_trgm, btree_gist; UUIDv7
keys
Authentication
Better Auth (e-mail and password, admin,
access-control plugins)
Prisma adapter; 2FA plugin for admins
Background jobs
pg-boss (PostgreSQL-based queue)
No Redis required; dedicated worker process
E-mail
React Email templates; Amazon SES or Resend
Queue, retry, bounce handling, .ics attachments
Files
S3-compatible object storage; ClamAV scan
Presigned upload and download; never in the
database
PDF / certificates
React-PDF or headless Chromium in the worker
QR code with verification token
Observability
Sentry, pino JSON logs, OpenTelemetry, uptime
checks
Request id in every log line
Testing
Vitest, Testcontainers, Playwright, k6, axe
Real PostgreSQL in integration tests
Delivery
Docker, GitHub Actions or GitLab CI, IaC
(Terraform)
Staging mirrors production
Training Management System  |  Architecture & Delivery Roadmap
System architecture
Confidential - Internal use
12

## Page 13

Deployment topology
Users
web · mobile
CDN + WAF
 TLS
Load
balancer
PRIVATE NETWORK
App container A
 Next.js
App container B
 Next.js
Worker container
 pg-boss jobs
ClamAV scanner
PostgreSQL
 primary
Standby replica
+ PITR backups
Object storage
Email provider
replication
Staging mirrors production at smaller scale
 Figure 4. Production deployment. Two or more stateless app containers behind a load balancer, a separate worker, managed
 PostgreSQL with a replica, and object storage.
WATCH OUT
pg-boss needs a long-running worker process. If you host the web app on a serverless platform, run the worker as a
separate container or service. Do not try to run queues inside serverless functions.
Hosting options
 Option
Description
Strengths
Trade-offs
A. Managed PaaS
Vercel or similar for the web app;
managed PostgreSQL; S3; small
worker container
Fastest start, little operations
work
Data residency may be offshore;
worker needs separate hosting
B. Containers
in-country or
on-premises
Docker or Kubernetes on a local
cloud or the company data centre
Full control, residency
compliance, predictable cost
You operate patching, backups
and scaling
C. Hybrid
App and worker in-country; CDN and
e-mail provider external
Balanced; data stays local
Slightly more integration work
TIP
If the company is regulated (for example a bank or financial institution), confirm data-residency, hosting and outsourcing
rules with the compliance team before choosing the hosting model. Option B or C is the usual answer.
Training Management System  |  Architecture & Delivery Roadmap
System architecture
Confidential - Internal use
13

## Page 14

Architecture decision records
 ID
Decision
Reason
ADR-01
Modular monolith
Smallest operational surface that still enforces boundaries
ADR-02
pg-boss for jobs
Transactional enqueue with business writes; no Redis to run
ADR-03
Presigned URLs, files in object storage
Keeps the database small; offloads bandwidth; scan before
release
ADR-04
UUIDv7 primary keys
Unguessable in URLs and time-ordered for index locality
ADR-05
UTC storage, Asia/Dhaka display
Avoids daylight and conversion bugs; one rule everywhere
ADR-06
Snapshot org data on enrolment
Historical reports stay correct after transfers and promotions
ADR-07
Server Actions for UI mutations; Route Handlers for
webhooks, exports, public pages
Right tool for each boundary; both call the same services
ADR-08
Database constraints as last line of defence
Exclusion and check constraints catch bugs the app misses
Training Management System  |  Architecture & Delivery Roadmap
System architecture
Confidential - Internal use
14

## Page 15

4
Domain and data model
Entities, constraints, indexes and integrity
The model separates definition from occurrence: a Course is what is taught; a Batch is one run of it;
a TrainingSession is one meeting inside a batch. An Enrollment links an employee to a batch and
carries the outcome. This separation is what makes multi-day trainings, per-session attendance,
repeated courses and accurate history possible.
Core entity relationships
 Branch · Dept · Desig.
code (unique)
name
parentId (branch)
grade (designation)
Employee
employeeNo (unique)
fullName
workEmail (citext)
branchId, departmentId
designationId
managerId (self)
joinedOn, status
deletedAt
User (Better Auth)
email (unique)
role
banned
mustChangePassword
Certificate
enrollmentId (unique)
number (unique)
verifyToken (unique)
expiresAt, revokedAt
Enrollment
(batchId, employeeId) UQ
status (enum)
enrolledById
branch/dept/desig snapshot
waitlistPos
attendancePct
score
completedAt
AttendanceRecord
(sessionId, enrollmentId) UQ
status
method (QR/CODE/MANUAL)
checkedInAt
markedById
Course
code (unique)
title
durationHours
validityMonths
minAttendancePct
requiresCascade
Batch
code (unique)
courseId
mode (onsite/online)
capacity
startsAt, endsAt
status
venueId, meetingUrl
TrainingSession
(batchId, seq) UQ
startsAt, endsAt
mode, venueId
checkInOpensAt/ClosesAt
checkInCodeHash
qrSecret
TrainerProfile
userId (nullable)
name, email
isExternal
via BatchTrainer
Venue
name
branchId
capacity
EXCLUDE overlap
1
N
1
0..1
1
 N
N
 1
1
0..1
1
N
N
 1
1
N
1
N
N
 M
N
 0..1
Snapshots on Enrollment (branch, department, designation) keep historical reports correct after transfers and promotions. All timestamps are timestamptz (UTC); primary
keys are UUIDv7 (time-ordered, index friendly).
 Figure 5. Core entities: organisation, catalogue, scheduling and enrolment. Enrollment is the pivot for attendance, certificate, evaluation
 and cascade.
Training Management System  |  Architecture & Delivery Roadmap
Domain and data model
Confidential - Internal use
15

## Page 16

Extended entities
COMPLIANCE (rule-based mandatory training)
RuleScope
ruleId
branchId?
departmentId?
designationId?
minGrade/maxGrade
ComplianceRule
courseId
trigger (enum)
dueInDays
renewalMonths
effectiveFrom/To
Assignment
(emp,course,cycle) UQ
dueOn
status (enum)
satisfiedById
expiresOn
Employee
id
branch / dept /
designation / grade
Enrollment
id
completedAt
N
 1
1
 N
N
 1
satisfiedBy 0..1
SPEAKER EVALUATION (anonymous aggregates)
Enrollment
id
batchId
Evaluation
(enrollmentId, trainerId) UQ
templateId
overallRating
submittedAt
EvalAnswer
(evaluationId, questionId)
rating?
text?
EvalQuestion
templateId, position
category
type (RATING/TEXT)
scaleMax
EvalTemplate
(name, version) UQ
isActive
1
 N
1
 N
N
 1
N
 1
LEARN IN THE BRANCH (cascade reporting)
Enrollment
id
completedAt
CascadeTask
enrollmentId (unique)
status (enum)
dueOn
reviewedById
reviewNote
CascadeSession
taskId
heldOn, durationMin
topic, summary
challenges, outcome
CascadeAttendee
(sessionId, employeeId)
colleague who learned
SessionFile
(sessionId, fileId)
kind: photo / sheet
-> StoredFile
1
0..1
1
 N
1
 N
1
 N
 Figure 6. Compliance rules, speaker evaluation and learn-in-the-branch entities, each attached to Employee or Enrollment.
Modelling conventions
 Convention
Rule
Identifiers
UUIDv7 text keys (uuid(7) requires current Prisma); human-friendly codes (employee number, batch
code, certificate number) are separate unique columns
Naming
PascalCase models in Prisma, snake_case tables through @@map; camelCase columns (quote them in raw
SQL)
Timestamps
createdAt and updatedAt on mutable tables; UTC; calendar dates use @db.Date
Deletion
Soft delete (deletedAt) only for Employee; training history is never deleted; enrolments end in a status,
not a delete
Enumerations
Prisma enums for closed sets; reference tables where admins must edit the list
Snapshots
Enrollment stores branch, department and designation at enrolment time; reports group by the snapshot
Auditing
Application-level audit log with before/after JSON for all admin writes and attendance overrides
Search
pg_trgm GIN index for fuzzy employee name search; citext for case-insensitive e-mail
Training Management System  |  Architecture & Delivery Roadmap
Domain and data model
Confidential - Internal use
16

## Page 17

Integrity constraints and indexes
 Constraint / index
Purpose
UNIQUE (batchId, employeeId) on Enrollment
An employee cannot be enrolled twice in the same batch
UNIQUE (sessionId, enrollmentId) on AttendanceRecord
One attendance record per person per session; makes check-in
idempotent
UNIQUE (enrollmentId, trainerId) on Evaluation
One evaluation per participant per trainer
UNIQUE (employeeId, courseId, cycle) on
ComplianceAssignment
Rule engine can run repeatedly without duplicates
EXCLUDE USING gist on venue and time range
No double-booked venue, even under concurrent writes
CHECK endsAt > startsAt; capacity > 0; percentage 0-100
Rejects impossible data at the source
INDEX Enrollment (employeeId, status, completedAt
DESC)
Transcript and 'how long ago' queries
INDEX Enrollment (branchId, completedAt)
Branch participation reports
PARTIAL INDEX ComplianceAssignment (dueOn)
WHERE open
Nightly overdue sweep touches only open items
INDEX AuditLog (entityType, entityId, createdAt)
Show the history of any record quickly
GIN trigram on Employee.fullName
Type-ahead search across 10,000 names
Capacity enforcement without over-booking
Two admins enrolling at the same moment must never exceed capacity. Lock the batch row inside a transaction,
count active enrolments, then insert as confirmed or waitlisted.
// modules/enrollment/service.ts
export async function enrolEmployees(ctx: Ctx, batchId: string, employeeIds: string[]) {
  assertCan(ctx, "enrollment", "write");
  return prisma.$transaction(async (tx) => {
    // 1. serialise concurrent enrolments for this batch
    const [batch] = await tx.$queryRaw<Batch[]>`SELECT * FROM batch WHERE id = ${batchId} FOR UPDATE`;
    if (!batch || !["PUBLISHED", "ENROLLMENT_CLOSED"].includes(batch.status))
      throw new DomainError("BATCH_NOT_OPEN");
    let active = await tx.enrollment.count({ where: { batchId, status: { in: ["INVITED", "CONFIRMED"] } } });
    const results = [];
    for (const employeeId of employeeIds) {
      const emp = await tx.employee.findUniqueOrThrow({ where: { id: employeeId } });
      await checkEligibility(tx, emp, batch);          // active, prerequisites, schedule clash
      const full = active >= batch.capacity;
      const row = await tx.enrollment.create({ data: {
        batchId, employeeId, enrolledById: ctx.user.id,
        status: full ? "WAITLISTED" : "INVITED",
        branchId: emp.branchId, departmentId: emp.departmentId, designationId: emp.designationId, // snapshot
      }});
      if (!full) active++;
      await enqueue(tx, "enrollment.invite", { enrollmentId: row.id });   // pg-boss, same transaction
      await audit(tx, ctx, "enrollment.create", "Enrollment", row.id, null, row);
      results.push(row);
    }
    return results;
  }, { isolationLevel: "ReadCommitted", timeout: 20_000 });
}
BEST PRACTICE
Enqueue the e-mail job inside the same database transaction as the enrolment. Either both happen or neither does,
which removes the classic 'saved but never e-mailed' bug.
Training Management System  |  Architecture & Delivery Roadmap
Domain and data model
Confidential - Internal use
17

## Page 18

Data lifecycle
 Data
Retention
Handling
Training records, certificates
Employment plus legal period
(typically 7+ years)
Never deleted; archived to read-only partitions if needed
Audit log
7 years
Append-only; monthly partitions; restricted to auditors
and admins
E-mail log
13 months
Purge payload after 90 days; keep status only
Evaluation responses
Indefinite, anonymised
Participant link removed from trainer-facing views and
exports
Cascade evidence files
3 years
Lifecycle rule moves to cold storage, then deletes
Sessions and verification
tokens
Short
Expired rows purged nightly
Resigned employees
Keep history; disable login
Ban user and revoke sessions; keep Employee row
Schema evolution policy
 - Every change is a reviewed Prisma migration; prisma migrate deploy in CI/CD, never db push in
production.
- Use expand and contract: add the new column (expand), deploy code that writes both, backfill, switch reads,
then drop the old column (contract). This allows zero-downtime releases.
- Keep raw-SQL constraints in a dedicated migration folder so they are not lost when the Prisma schema is
regenerated.
- Test every migration against a copy of production-sized data before release.
Training Management System  |  Architecture & Delivery Roadmap
Domain and data model
Confidential - Internal use
18

## Page 19

5
Identity and authorisation
Better Auth, roles, policies and data scoping
Account lifecycle
Accounts are never self-registered. Admins import employees, create accounts in bulk, and employees receive a
one-time link to set their own password. No password is ever e-mailed.
HR import (CSV)
creates Employee rows
Admin clicks
“Create accounts”
auth.api.createUser
 random pwd,
mustChange = true
Link
Employee.userId
Queue welcome
 email with
reset-link token
User opens link,
sets own password
Login: scrypt verify
 rate limit
 lockout
mustChange
 Password?
Force password
change screen
yes
Session issued
8 h · httpOnly · Secure
 SameSite=Lax
no
Role redirect
/admin · /teacher
 /me
OFFBOARDING PATH
Offboarding: status =
RESIGNED / RETIRED
ban user + revoke
 all sessions
History retained for audit &
transcripts (never deleted)
 Figure 7. Account lifecycle from employee import to offboarding. Resignation disables login but preserves all training history.
Better Auth configuration
 // lib/auth.ts
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin as adminPlugin, twoFactor } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { ac, roles } from "./permissions";
export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
Training Management System  |  Architecture & Delivery Roadmap
Identity and authorisation
Confidential - Internal use
19

## Page 20

enabled: true,
    disableSignUp: true,                 // accounts are created by admins only
    minPasswordLength: 10,
    maxPasswordLength: 128,
    sendResetPassword: async ({ user, url }) => enqueueEmail("set-password", user, { url }),
    resetPasswordTokenExpiresIn: 60 * 60 * 24,   // welcome link valid 24 h
  },
  user: { additionalFields: { mustChangePassword: { type: "boolean", defaultValue: true, input: false } } },
  session: { expiresIn: 60 * 60 * 8, updateAge: 60 * 30, cookieCache: { enabled: true, maxAge: 300 } },
  rateLimit: { enabled: true, window: 60, max: 10, storage: "database" },
  advanced: { useSecureCookies: true, ipAddress: { ipAddressHeaders: ["x-forwarded-for"] } },
  trustedOrigins: [process.env.APP_URL!],
  plugins: [adminPlugin({ ac, roles, defaultRole: "participant" }), twoFactor(), nextCookies()],
});
Password and session policy
 Control
Setting
Rationale
Minimum length
10 characters, no forced complexity rules
Length beats complexity; follows current
NIST guidance
Breached-password
check
Reject known-breached passwords
Stops reuse of leaked credentials
Hashing
Better Auth default (scrypt), never custom
Memory-hard; maintained library
Lockout
5 failures: 15-minute lock, plus alert to admin
Throttles credential stuffing
Session lifetime
8 h absolute, sliding refresh every 30 min
Matches a working day
2FA
Mandatory for admin and branch manager; optional for
others
Protects the highest-impact accounts
First login
Redirect to set password while mustChangePassword
is true
Admin never knows the final password
Session management
List active sessions; log out everywhere; revoke on ban
or password change
Rapid response to a lost device
Four layers of authorisation
Request
1 Proxy
(optional cookie
 check)
302 → /login
2 Session
getSession()
401
3 Role permission
 hasPermission()
403
4 Resource policy
ownership / relation
403 / 404
5 Scoped query
 WHERE
branch/owner
empty set
Response (only authorised rows)
The proxy (formerly “middleware”) only improves UX by redirecting early. Real enforcement happens in steps 2 to 5, on the server, for every Server Action and Route
Handler.
 Figure 8. Authorisation layers. Middleware is only a convenience redirect; the real checks are role permission, resource policy and data
 scoping.
Training Management System  |  Architecture & Delivery Roadmap
Identity and authorisation
Confidential - Internal use
20

## Page 21

RISK
Never rely on Next.js middleware or hidden menu items for security. Every Server Action and Route Handler must
authenticate and authorise independently, because they can be called directly.
Role permissions (Better Auth access control)
 // lib/permissions.ts
import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements, adminAc } from "better-auth/plugins/admin/access";
const statement = {
  ...defaultStatements,
  employee:   ["read", "write", "import"],
  course:     ["read", "write"],
  batch:      ["read", "write", "publish"],
  enrollment: ["read", "write"],
  attendance: ["read", "mark", "override"],
  material:   ["read", "write"],
  compliance: ["read", "manage", "exempt"],
  evaluation: ["submit", "read.own", "read.all"],
  cascade:    ["submit", "review"],
  report:     ["read.own", "read.branch", "read.all", "export"],
  audit:      ["read"],
} as const;
export const ac = createAccessControl(statement);
export const roles = {
  admin: ac.newRole({ ...adminAc.statements, employee: ["read","write","import"], course: ["read","write"],
    batch: ["read","write","publish"], enrollment: ["read","write"], attendance: ["read","mark","override"],
    material: ["read","write"], compliance: ["read","manage","exempt"], evaluation: ["read.all"],
    cascade: ["review"], report: ["read.all","export"], audit: ["read"] }),
  teacher: ac.newRole({ batch: ["read"], enrollment: ["read"], attendance: ["read","mark"],
    material: ["read","write"], evaluation: ["read.own"], report: ["read.own"] }),
  branch_manager: ac.newRole({ report: ["read.branch"], compliance: ["read"],
    cascade: ["review"], batch: ["read"] }),
  participant: ac.newRole({ batch: ["read"], material: ["read"], evaluation: ["submit"],
    cascade: ["submit"], report: ["read.own"] }),
};
Permission matrix
 Capability
Participant
Teacher
Branch mgr
Admin
Own transcript and certificates
Own
Own
Own
Any
View batches
Enrolled only
Assigned only
Own branch
All
Enrol / withdraw people
Confirm or decline
own
No
No
Yes
Mark attendance
Self check-in
Assigned batches
No
All plus override
Upload materials
No
Own batches
No
All
Download materials
If enrolled / completed
Own batches
No
All
Evaluations
Submit own
Aggregates, own, after
threshold
No
All and trends
Cascade report
Submit own
No
Review own branch
Review all
Reports
Own
Own batches
Own branch
All plus export
Compliance rules
No
No
Read own branch
Manage and
exempt
Audit log
No
No
No
Read
Training Management System  |  Architecture & Delivery Roadmap
Identity and authorisation
Confidential - Internal use
21

## Page 22

Resource policies and data scoping
Role permission answers 'may this kind of user do this kind of thing?'. A policy answers 'may this user touch this
particular record?'. The most robust approach is to build the answer into the query, so unauthorised rows are never
fetched.
// modules/batches/repo.ts - every repository function takes ctx and applies scope
export function scopeBatches(ctx: Ctx): Prisma.BatchWhereInput {
  switch (ctx.role) {
    case "admin":          return {};
    case "teacher":        return { trainers: { some: { trainer: { userId: ctx.user.id } } } };
    case "branch_manager": return { enrollments: { some: { branchId: ctx.employee.branchId } } };
    default:               return { enrollments: { some: { employeeId: ctx.employee.id } } };
  }
}
export const listBatches = (ctx: Ctx, q: BatchQuery) =>
  prisma.batch.findMany({ where: { AND: [scopeBatches(ctx), buildFilters(q)] }, ...paginate(q) });
// every Server Action
export async function markAttendance(input: unknown) {
  const ctx    = await requireSession();                    // 401 if no valid session
  const data   = MarkAttendanceSchema.parse(input);         // Zod: reject malformed input
  assertCan(ctx, "attendance", "mark");                     // role permission
  const batch  = await batchRepo.getScoped(ctx, data.batchId); // 404 if not in scope (never 403 leak)
  return attendanceService.mark(ctx, batch, data);          // business rules and audit
}
BEST PRACTICE
Return 404, not 403, when a record exists but is outside the caller's scope. This avoids confirming that the record
exists.
TIP
Re-authentication (password prompt) before destructive actions such as bulk withdrawal, certificate revocation, rule
deletion or impersonation. Every impersonation session is audited and time-limited.
Training Management System  |  Architecture & Delivery Roadmap
Identity and authorisation
Confidential - Internal use
22

## Page 23

6
Core workflows
Step-by-step flows, states and rules
Each workflow below shows the happy path, the exception paths, and the state machine that governs
the record. State machines are enforced in the service layer; illegal transitions throw errors and are
covered by unit tests.
Enrolment (admin-driven)
 Admin selects batch + employees (search / filter / CSV)
Validate each employee (server-side)
Employee ACTIVE?
Prerequisites met?
yes
Schedule clash?
yes
Skip and add to error report
with reason (shown to admin)
no
no
Warn admin: override allowed
with written reason (audited)
yes
BEGIN tx · SELECT batch FOR UPDATE
 count active enrolments
no
Seats available?
Enrolment = INVITED
Enrolment = WAITLISTED (pos n)
yes
no
COMMIT · queue email with .ics file
 + in-app notification (via outbox)
Participant
responds?
CONFIRMED
DECLINED
confirm
decline
A declined or withdrawn seat triggers a job that promotes the next waitlisted employee.
 Figure 9. Enrolment flow. Eligibility checks run before anything is sent; capacity is enforced under a row lock.
Training Management System  |  Architecture & Delivery Roadmap
Core workflows
Confidential - Internal use
23

## Page 24

WAITLISTED
INVITED
CONFIRMED
DECLINED
WITHDRAWN
COMPLETED · thresholds met
FAILED · below threshold
NO_SHOW · attended none
admin enrols
full batch
seat freed
confirms
declines
withdrawn by admin
Terminal states are final; re-training means a new Enrolment in
a later batch.
 Figure 10. Enrolment state machine. Terminal outcomes are completed, failed, no-show, declined and withdrawn.
- Eligibility checks: employee ACTIVE, prerequisites completed and not expired, no overlapping session, not
already enrolled.
- Waitlist: promoted automatically in order when a seat frees; the promoted person gets a fresh invitation with a
response deadline.
- Decline: requires a reason; admin sees declines on the batch dashboard and may backfill.
- Calendar: every invitation carries an .ics file; cancellations and changes send an updated .ics with the same UID
and a higher sequence.
Attendance: QR, code and manual
 Teacher browser
Participant phone
Next.js server
PostgreSQL
open check-in (sessionId)
set window · rotate qrSecret
QR token (HMAC, 30 s) + 6-digit code
QR refreshes every 30 s
POST /check-in {token | code}
verify HMAC · TTL · window · enrolled?
INSERT attendance ON CONFLICT DO NOTHING
ok
write audit_log
✔ checked in 09:02 (method SELF_QR)
rejected: expired · not enrolled · window closed
Rate limit: 10 requests/min/user on /check-in · token is single-session scoped
 Figure 11. Check-in sequence. The QR token rotates every 30 seconds and is verified server-side against enrolment, window and
 signature.
A rotating token prevents someone photographing the QR and sending it to a colleague. The token is a signed,
short-lived value; it is verified, never stored per scan.
Training Management System  |  Architecture & Delivery Roadmap
Core workflows
Confidential - Internal use
24

## Page 25

// modules/attendance/token.ts - rotating, signed check-in token
import { createHmac, timingSafeEqual } from "node:crypto";
const STEP = 30; // seconds
export function tokenFor(session: { id: string; qrSecret: string }, now = Date.now()) {
  const window = Math.floor(now / 1000 / STEP);
  const mac = createHmac("sha256", session.qrSecret)
    .update(`${session.id}.${window}`).digest("base64url").slice(0, 22);
  return `${session.id}.${window}.${mac}`;
}
export function verifyToken(token: string, session: { id: string; qrSecret: string }, now = Date.now()) {
  const [sid, win, mac] = token.split(".");
  if (sid !== session.id) return false;
  const current = Math.floor(now / 1000 / STEP);
  if (Math.abs(current - Number(win)) > 1) return false;          // allow one step of clock drift
  const expected = tokenFor(session, Number(win) * STEP * 1000).split(".")[2];
  return mac.length === expected.length && timingSafeEqual(Buffer.from(mac), Buffer.from(expected));
}
Method
Who acts
Controls
SELF_QR
Participant scans trainer's rotating QR
Valid token, within window, caller is enrolled, rate-limited
per user and IP
SELF_CODE
Participant types a 6-digit code (online or no
camera)
Code hashed in DB, rotates, attempts limited (5 per
minute)
ONLINE_JOIN
Imported from Zoom / Meet / Teams logs (later
phase)
Matched by e-mail; admin reviews unmatched rows
MANUAL
Trainer or admin marks roster
Records marker; overrides logged in audit with
before/after
Training Management System  |  Architecture & Delivery Roadmap
Core workflows
Confidential - Internal use
25

## Page 26

Batch finalisation and certificates
 Batch ends → job batch.finalize (idempotent)
Compute attendancePct per enrolment
(present + late weighted) / total sessions
attendance ≥
course.minAttendancePct?
score ≥ passScore?
 (if assessed)
yes
FAILED (attended some)
or NO_SHOW (attended none)
no
no
COMPLETED + completedAt
yes
Issue certificate
number · QR · expiry
Mark compliance
assignment SATISFIED
Create CascadeTask
(if requiresCascade)
Open evaluation
window + notify
fan-out inside one transaction + outbox events
Each step is idempotent: re-running the job never issues a second certificate or duplicate task (unique keys).
 Figure 12. Finalisation job. It computes attendance percentage and score, then issues certificates, creates cascade tasks and satisfies
 compliance assignments.
BEST PRACTICE
Make finalisation idempotent: running it twice must not issue two certificates. The unique key on
Certificate.enrollmentId and a status check inside the transaction guarantee this.
Mandatory training by rule
A rule says 'everyone matching this scope must complete this course within N days of the trigger, and renew every M
months'. The engine converts rules into per-employee assignments so that reports are simple joins instead of
re-evaluating rules.
Training Management System  |  Architecture & Delivery Roadmap
Core workflows
Confidential - Internal use
26

## Page 27

Nightly cron 02:00
Employee created
Transfer / promotion
Rule published
Load active rules (effectiveFrom ≤ today ≤ effectiveTo)
Select ACTIVE employees in scope (batched, 500 per page)
Match scope: ANY scope row matches; inside a row ALL non-null
fields must match (branch, dept, designation, grade, joinedAfter)
Assignment exists for this
 cycle?
INSERT assignment (unique key makes
the job idempotent) + notify employee
no
Valid completion on
 record?
yes
SATISFIED · expiresOn = completion + validity
yes
Near expiry?
create next cycle
 (cycle + 1)
renewal
dueOn passed?
no
OVERDUE + escalate
Remind T-14, T-7, T-1
yes
no
Exemptions are set by an admin with reason and approver; they are audited and appear in reports as EXEMPT.
 Figure 13. Compliance engine. Nightly and event-driven evaluation creates assignments, flips status to overdue, and creates renewal
 cycles.
PENDING
SATISFIED
EXPIRED
OVERDUE
EXEMPT (admin + reason)
completes
validity ends
due date passes
completes late
renewal creates a new cycle (cycle + 1)
admin can exempt PENDING or OVERDUE assignments
 Figure 14. Compliance assignment states. Exempt requires a reason and an approver and stays on the audit trail.
Trigger
Example
Due date calculation
ON_JOIN
Code of Conduct for every new joiner
joinedOn + dueInDays
ON_PROMOTION
Leadership Foundations when grade reaches 7
lastPromotedOn + dueInDays
ONE_TIME
New regulation briefing for all officers
effectiveFrom + dueInDays
RECURRING
AML refresher every 12 months
previous expiry minus lead time, or satisfiedOn +
renewalMonths
Training Management System  |  Architecture & Delivery Roadmap
Core workflows
Confidential - Internal use
27

## Page 28

Speaker evaluation
Batch
COMPLETED
Open window
(evaluationOpensAt)
One form per
trainer for each
 participant
Submit once
(unique enrolment
 + trainer)
Nightly
aggregation
≥ 5 responses?
Trainer scorecard shown:
averages + anonymised comments
yes
Hidden: “not enough responses”
no
Admin sees per-trainer trends,
 low-score alerts, distribution
Identity is stored only to enforce one-response-per-trainer;
it is never exposed in any trainer or manager view.
 Figure 15. Evaluation flow. Anonymity is protected by a minimum-response threshold and by removing participant identity from
 trainer-facing queries.
- Evaluation opens after the batch completes and closes after a set window (for example 7 days); reminders go out
at day 1 and day 5.
- One form per trainer per participant; template versions are immutable once used, so old results remain
interpretable.
- Trainers see aggregates and comments only when at least 5 responses exist; admins see trends and trainer
scorecards.
- Free-text comments are screened for profanity and shown without any participant identifier.
Learn in the branch (cascade)
Training
COMPLETED
CascadeTask created
 due = completed +
 cascadeDueDays
Participant logs
sessions: date, topic,
 attendees, photos
Submits report
to training centre
STATUS LIFECYCLE
ASSIGNED
SUBMITTED
APPROVED
REVISION_REQUESTED
OVERDUE
WAIVED (admin)
submit
approve
needs work
due date passes
 resubmit
Optional policy: certificate stays “provisional” until the cascade report is approved. Overdue tasks escalate to the branch manager.
 Figure 16. Cascade workflow. After completion the participant teaches colleagues in the branch and submits evidence; the branch
 manager or training centre approves.
- Evidence: date, duration, topic, summary, attendees chosen from the participant's own branch, plus photos or a
signed sign-in sheet.
- Approval: branch manager reviews first; training centre can override. Revision requests carry a note.
- Escalation: reminder at 7 days and 1 day before due; at due date the participant's manager is notified; overdue
tasks appear on the branch dashboard.
- Certificate option: a course may mark the certificate 'provisional' until the cascade is approved.
Training Management System  |  Architecture & Delivery Roadmap
Core workflows
Confidential - Internal use
28

## Page 29

Notifications
Domain event
enrolment.created
Outbox row
 (same tx)
pg-boss queue
retry + backoff
Worker
render template
Provider
SES/Resend
email_log
status · attempts
Webhook:
delivered/bounced
In-app notification
(bell icon, unread count)
Admin can resend
 failed emails
Transactional outbox: the email is only queued if the database change commits, so users never get mail for rolled-back actions.
Reminders (7 days, 1 day, 1 hour), overdue escalations and weekly digests are scheduled jobs on the same queue.
 Figure 17. Notification pipeline. Business events enqueue jobs; the worker renders templates, sends, retries on failure and records the
 outcome.
Event
Audience
Channel
Timing
Enrolment invitation
Participant
E-mail with .ics, in-app
Immediately
Reminder
Participant, trainer
E-mail, in-app
7 days, 1 day, 1 hour before
Waitlist promotion
Participant
E-mail, in-app
Immediately
Evaluation open / reminder
Participant
E-mail, in-app
On completion; day 1 and day 5
Cascade due / overdue
Participant, manager
E-mail, in-app
7 d, 1 d, due date, then weekly
Compliance overdue
Employee, then line
manager
E-mail, in-app
Due date; weekly digest
Certificate expiring
Employee
E-mail
90, 60, 30 days before
Secure file upload and download
UPLOAD
Teacher picks
 file in UI
Server checks authz +
 issues presigned PUT
 (type / size limits)
Browser uploads
direct to quarantine
 bucket
Worker: ClamAV scan
 sha256 · MIME sniff
Clean?
Move to private bucket
scanStatus = CLEAN → publishable
INFECTED → delete + alert admin
yes
no
DOWNLOAD
Participant clicks
 download
Server authz: enrolled?
 material.access rule?
 batch started?
Presigned GET
 (60 s expiry)
403 + audit entry
denied
Never store files in PostgreSQL;
 never expose bucket URLs
 Figure 18. File pipeline. Files go straight to object storage through presigned URLs, are scanned, and become downloadable only after
 passing and an authorisation check.
Training Management System  |  Architecture & Delivery Roadmap
Core workflows
Confidential - Internal use
29

## Page 30

- Allow-list of types (PDF, PPTX, DOCX, XLSX, MP4, JPG, PNG) and a maximum size per type; verify the real
MIME type by content, not extension.
- Store a SHA-256 hash; reject known-bad hashes; quarantine until the antivirus scan is CLEAN.
- Downloads are issued as short-lived (60-second) signed URLs only after the policy layer confirms the user may
read that material.
Training Management System  |  Architecture & Delivery Roadmap
Core workflows
Confidential - Internal use
30

## Page 31

7
UX and UI design
Information architecture, design system and reference screens
Information architecture
 PUBLIC: /login · /forgot-password · /reset-password · /verify/[certificateToken]
PARTICIPANT /me
Dashboard
My trainings & calendar
Check in (QR / code)
Materials library
Evaluations to complete
Learn-in-branch tasks
Transcript & certificates
Notifications
Profile & security
TEACHER /teacher
Dashboard
My batches
Roster & attendance
Open check-in (QR display)
Upload materials
My scorecard
(+ all participant pages)
BRANCH MGR /branch
Branch dashboard
Team transcripts
Compliance status
Cascade review
Branch reports
(+ all participant pages)
ADMIN /admin
Dashboard
Employees & import
Org setup
Courses & prerequisites
Batches & sessions
Enrolment & waitlist
Compliance rules
Evaluation templates
Cascade review
Reports & exports
Audit log
Settings & roles
 Figure 19. Sitemap by role. The participant area is deliberately small and task-focused; the admin area is dense and filter-driven.
Design principles
 - Task first. Each role's home screen answers 'what should I do now?' with one primary action.
- Progressive disclosure. Show summaries; reveal detail on drill-down, not all at once.
- Filters over scrolling. With 10,000 people, every list is searchable, filterable, sortable and server-paginated.
- Fast feedback. Optimistic UI where safe; skeleton loaders; toasts with undo for reversible actions.
- Honest errors. Say what happened and what to do next; never expose stack traces or internal ids.
- Consistent patterns. The same table, filter bar, dialog and form components everywhere.
Training Management System  |  Architecture & Delivery Roadmap
UX and UI design
Confidential - Internal use
31

## Page 32

Design system
 Element
Specification
Foundation
Tailwind CSS with design tokens as CSS variables; shadcn/ui components on Radix primitives for
accessible behaviour
Colour
Neutral slate base, one brand blue, semantic green / amber / red; every pair meets 4.5:1 contrast; dark
mode via token swap
Typography
Inter or system UI for English; Noto Sans Bengali for Bangla; 16 px base; 1.5 line height; tabular numerals
in tables
Spacing and grid
4-pt scale; 12-column desktop grid; content max width 1280 px; sidebar 240 px collapsing to a drawer on
mobile
Components
Data table, filter bar, stepper, status badge, stat card, calendar, dialog, drawer, toast, command palette,
empty state, skeleton
Status colours
Valid / completed = green; due soon / waitlisted = amber; overdue / failed / expired = red; neutral info =
blue
Iconography
lucide icons with text labels; icons never carry meaning alone
Motion
150-200 ms transitions; honour prefers-reduced-motion
Documentation
Storybook or equivalent catalogue so designers and developers share one source
Accessibility and localisation
 Topic
Practice
Keyboard
Every action reachable and operable by keyboard; visible focus ring; logical tab order; skip-to-content link
Screen readers
Semantic HTML first; ARIA only to fill gaps; labelled inputs; live regions for toasts and async results
Forms
Inline validation with text, not colour alone; error summary at top; autocomplete attributes
Tables
Proper header cells, sortable column announcements, row actions reachable without a mouse
Testing
axe in CI on every key page; manual screen-reader pass before release
i18n
next-intl or equivalent; message catalogues for English and Bangla; no concatenated sentences;
pluralisation rules
Dates and numbers
Stored UTC; displayed in Asia/Dhaka with Intl APIs; Bangla numerals optional per user preference
Mobile
Mobile-first for participant screens (check-in, evaluation, cascade); 44 px touch targets; PWA later
Training Management System  |  Architecture & Delivery Roadmap
UX and UI design
Confidential - Internal use
32

## Page 33

Reference screens
The twelve screens that follow are reference mockups drawn for this system. They define layout, hierarchy and
behaviour for each key workflow, so designers can refine them and developers can build from them. Each is
annotated with the design intent.
TIP
About reference images. The mockups here are original illustrations created for this project, so they carry no licensing
issues and match your exact features. Screenshots of commercial products cannot be embedded; see Appendix F for
products worth studying for inspiration.
Screen 1: Sign-in page
 https://training.company.com/login
Training Institute
Learn. Certify.
Grow together.
One place for your schedule, certificates and study
materials across every branch.
Sign in
Use the work email provided by the training centre.
Work email
name@company.com
Password
••••••••••
Forgot password?
Sign in
Too many attempts. Try again in 10 minutes.
Need help? Contact the training centre
Single, calm entry point. Password sign-in only (admin-created accounts). Show lockout and rate-limit messages clearly, link to
“Forgot password”, and keep the form accessible by keyboard and screen reader.
Training Management System  |  Architecture & Delivery Roadmap
UX and UI design
Confidential - Internal use
33

## Page 34

Screen 2: Participant dashboard
 https://training.company.com/me
TMS
Dashboard
My trainings
Calendar
Check in
Materials
Evaluations
Branch tasks
Transcript
Participant
Good morning, Ayesha
Search…
AK
Upcoming
2
next: Mon
Completed (12 mo)
5
+1 this month
Mandatory due
1
in 12 days
Pending tasks
2
action needed
Next sessions
19
OCT
Anti-Money Laundering 2026
Mon 19 Oct · 10:00 · Head Office
Confirmed
28
OCT
Customer Service Excellence
Wed 28 Oct · Online
Invited
9
NOV
Cyber Security Basics
Mon 9 Nov · Branch lab
Waitlist
Action centre
Submit branch report: AML
Rate speaker: Data Privacy
Confirm: Customer Service
Compliance status
Code of Conduct (annual)
Compliant · expires 14 Mar 2027
AML Basics (annual)
Due in 12 days
Fire Safety (2 yearly)
Compliant · expires Jan 2028
First screen after login: what is next, what is due, what to do now. Highlight overdue mandatory training and pending
evaluation/cascade tasks with colour and a single clear action button.
Screen 3: My transcript and certificates
 https://training.company.com/me/transcript
TMS
Dashboard
My trainings
Calendar
Check in
Materials
Evaluations
Branch tasks
Transcript
Participant
Transcript
Search…
AK
AK
Ayesha Khan  ·  EMP-004217
Senior Officer · Agrabad Branch · Joined 2019
Download PDF
Status
All
Completed
Expiring soon
Expired
Training
Completed
Ago
Score
Certificate
Status
AML Basics 2026
12 Mar 2026
7 months
88%
TC-2026-004871
Valid
Code of Conduct
14 Mar 2026
7 months
94%
TC-2026-005120
Valid
Customer Service Excellence
02 Nov 2025
11 months
81%
TC-2025-017733
Expires 60d
Fire Safety & Evacuation
10 Jan 2024
2 yr 9 mo
Pass
TC-2024-000912
Valid
Data Privacy Essentials
18 Sep 2024
13 months
76%
TC-2024-011402
Expired
Leadership Foundations
03 Jun 2023
3 yr 4 mo
90%
TC-2023-006601
Valid
Showing 6 of 14 records
Printable record of every completed training with “how long ago”, score, certificate number and expiry. A download-as-PDF button
and public verification QR give the document real-world value.
Training Management System  |  Architecture & Delivery Roadmap
UX and UI design
Confidential - Internal use
34

## Page 35

Screen 4: Admin dashboard
 https://training.company.com/admin
TMS
Dashboard
Employees
Courses
Batches
Enrolment
Compliance
Evaluations
Cascade
Reports
Audit log
Admin
Overview
Search…
AK
Active employees
10,214
+38 mo
Batches this month
47
12 live
Compliance rate
91.4%
+1.2 pt
Overdue assignments
612
-8%
Compliance by region
Dhaka
Ctg
Syl
Raj
Khu
Bar
Rng
target 90%
Today’s sessions
AML Basics · B-14
10:00 · seats
36/40
Leadership · B-09
11:30 · seats
24/40
Cyber Security · B-21
14:00 · seats
40/40
Fire Safety · B-33
15:30 · seats
16/40
Needs attention
14 enrolments waitlisted for AML Basics (B-14)
Review
Cascade reports overdue: 23 participants in 6 branches
Escalate
Trainer Rahman: 2 sessions clash on 21 Oct
Resolve
Operational control room: today’s sessions, seats filling, compliance health by branch and items needing attention. Every tile is
clickable and drills into the filtered report.
Screen 5: Batch builder and calendar
 https://training.company.com/admin/batches/new
TMS
Dashboard
Employees
Courses
Batches
Enrolment
Compliance
Evaluations
Cascade
Reports
Audit log
Admin
New batch
Search…
AK
Batch details
Course
AML Basics
Batch code
AML-2026-14
Capacity
40
Mode
Onsite ▾
Venue
Head Office · Hall B
Trainers
A. Rahman (lead) +1
Enrolment closes
12 Oct 2026
Save draft
Publish
Sessions · October 2026
 M
T
W
T
F
S
S
1
2
3
4
5
6
7
8
9
10
11
12
13
14
15
16
17
18
19
S1
20
S2
21
S3
22
23
24
25
26
27
28
Session plan
S1
Mon 19 Oct 10:00-13:00
Hall B
OK
S2
Tue 20 Oct 10:00-13:00
Hall B
OK
S3
Wed 21 Oct 10:00-13:00
Hall B
Trainer clash
Course = definition, Batch = one run with sessions, trainers and venue. Conflicts (trainer, venue, participant) are flagged inline
before saving; the database exclusion constraint is the final safety net.
Training Management System  |  Architecture & Delivery Roadmap
UX and UI design
Confidential - Internal use
35

## Page 36

Screen 6: Enrolment workspace
 https://training.company.com/admin/batches/AML-2026-14/enrol
TMS
Dashboard
Employees
Courses
Batches
Enrolment
Compliance
Evaluations
Cascade
Reports
Audit log
Admin
Enrol into AML-2026-14
Search…
AK
Branch
 Agrabad
Department
 All
Designation
 Officer+
Not trained in
 12 months
Matching employees (214)
Employee
Branch
Last trained
Eligibility
Ayesha Khan
Agrabad
7 months ago
Eligible
Imran Hossain
Agrabad
Never
Eligible
Nusrat Jahan
Agrabad
14 months ago
Eligible
Tanvir Ahmed
Halishahar
9 months ago
Missing prereq
Farhana Akter
Agrabad
3 months ago
Recently trained
Sohel Rana
Agrabad
Never
Eligible
Mitu Barua
GEC
2 yr ago
Eligible
Seat summary
34 / 40
 seats used
Selected: 5
Will fit: 5   Waitlist: 0
Blocked: 1  Warn: 1
Enrol selected
Import CSV
Emails with .ics are sent
after confirmation.
Admin picks people with filters (branch, department, designation, “not trained in X months”, overdue mandatory). The preview table
shows eligibility problems before anything is sent.
Screen 7: Teacher attendance console
 https://training.company.com/teacher/sessions/S1/attendance
TMS
Dashboard
My batches
Attendance
Materials
My scorecard
Teacher
AML-2026-14 · Session 1
Search…
AK
Self check-in
Code  4 8 2 9 1 7
 QR refreshes in 22 s
Window open until 10:15
Close window
Print sheet
Roster · 31 of 38 present
Participant
Status
Method
Ayesha Khan
Present
09:58 · QR
Imran Hossain
Present
10:01 · Code
Nusrat Jahan
Late
10:12 · QR
Tanvir Ahmed
Absent
-
Farhana Akter
Present
09:55 · QR
Sohel Rana
Present
Manual · A.R.
Mitu Barua
Present
10:03 · QR
Rakib Hasan
Excused
Leave
Manual changes require a note and appear in the audit log.
Trainer projects a rotating QR and short code; participants self check-in. The live roster shows arrivals in real time and allows
manual marking. Every manual override is audited.
Training Management System  |  Architecture & Delivery Roadmap
UX and UI design
Confidential - Internal use
36

## Page 37

Screen 8: Compliance dashboard
 https://training.company.com/admin/compliance
TMS
Dashboard
Employees
Courses
Batches
Enrolment
Compliance
Evaluations
Cascade
Reports
Audit log
Admin
Mandatory training compliance
Search…
AK
Compliant
9,318
Due ≤ 30 days
284
Expiring ≤ 90 days
471
Overdue
612
Status mix
91.4%
Overdue by branch (top 6)
Sylhet Main
114
Khulna Zone
96
Barishal
79
Rangpur
60
Cumilla
50
Mymensingh
36
Overdue assignments
Employee
Rule
Branch
Due
Days over
R. Hasan
AML Basics
Sylhet Main
30 Sep
12 days
S. Begum
Code of Conduct
Khulna Zone
02 Oct
10 days
T. Islam
AML Basics
Barishal
05 Oct
7 days
Notify managers
Answers “who is overdue or expiring, where?” in one view. Filter by rule, branch and designation, then bulk-notify or enrol straight
from the list. Exemptions require a reason and approver.
Screen 9: Learn-in-the-branch report
 https://training.company.com/me/branch-tasks/AML-2026-14
TMS
Dashboard
My trainings
Calendar
Check in
Materials
Evaluations
Branch tasks
Transcript
Participant
Branch session report
Search…
AK
AML Basics 2026 · due 11 Nov 2026
Target audience: 12 colleagues · Reached so far: 8
Due in 21 days
Session 1
Date held
26 Oct 2026
Duration (min)
45
Topic covered
Customer due diligence basics
Summary of what was taught
Attendees (picked from Agrabad Branch)
I. Hossain
N. Jahan
S. Rana
+5 more
+ Add attendee
Save session
Evidence
photo
sign-in.pdf
Upload photo / sheet
JPG, PNG, PDF · max 10 MB · virus scanned
Submit
When all sessions are logged, submit for review. You
can edit again if changes are requested.
Submit report
Status: ASSIGNED
Participant logs each knowledge-sharing session: date, topic, attendees from their own branch, photos or sign-in sheet. The
branch manager or training centre approves or requests changes.
Training Management System  |  Architecture & Delivery Roadmap
UX and UI design
Confidential - Internal use
37

## Page 38

Screen 10: Speaker evaluation form
 https://training.company.com/me/evaluations/AML-2026-14/rahman
TMS
Dashboard
My trainings
Calendar
Check in
Materials
Evaluations
Branch tasks
Transcript
Participant
Rate your trainer
Search…
AK
AR
Abdur Rahman · Lead trainer
AML Basics 2026 (B-14) · closes 26 Oct
Anonymous to trainer
Ratings (1 = poor, 5 = excellent)
Subject knowledge
1
2
3
4
5
Clarity of explanation
1
2
3
4
5
Engagement and interaction
1
2
3
4
5
Use of real examples
1
2
3
4
5
Time management
1
2
3
4
5
Overall: 4.0 / 5
Comment
Optional. Be specific and
respectful.
Submit
Save draft
Short, mobile-first rating form per trainer. Required ratings plus optional comment. Trainers only ever see aggregates after a
minimum of five responses, which protects honest feedback.
Screen 11: Reports and exports
 https://training.company.com/admin/reports/participation
TMS
Dashboard
Employees
Courses
Batches
Enrolment
Compliance
Evaluations
Cascade
Reports
Audit log
Admin
Participation report
Search…
AK
Course
 AML Basics
Branch
 All
Date range
 Jan - Oct 2026
Group by
 Employee
 Run report
3,482 results
Export CSV
Export XLSX
Employee
Branch
Course
Last attended
Ago
Times
Status
Ayesha Khan
Agrabad
AML Basics
12 Mar 2026
7 mo
3
Valid
Imran Hossain
Agrabad
AML Basics
Never
-
0
Overdue
Nusrat Jahan
Agrabad
AML Basics
20 Aug 2025
14 mo
2
Expired
Sohel Rana
GEC
AML Basics
02 Feb 2026
8 mo
1
Valid
Mitu Barua
GEC
AML Basics
11 Dec 2025
10 mo
4
Expiring
Rakib Hasan
Halishahar
AML Basics
09 Jul 2026
3 mo
1
Valid
Page 1 of 349
Filterable, paginated report with saved views. “Last attended” answers who participated in which training and how long ago. Large
exports run as background jobs and arrive as expiring links.
Training Management System  |  Architecture & Delivery Roadmap
UX and UI design
Confidential - Internal use
38

## Page 39

Screen 12: Public certificate verification
 https://training.company.com/verify/9f3c2a7e-4b1d-4c68
Training Institute · Certificate verification
✔
Valid certificate
This certificate was issued by Training Institute
Holder
Ayesha Khan
Training
Anti-Money Laundering Basics
Completed
12 March 2026
Valid until
12 March 2027
Certificate no.
TC-2026-004871
Verified live against the issuer’s records · revoked certificates show as invalid
Anyone (an auditor, another bank) can scan the QR on a certificate and confirm authenticity without logging in. Shows only name,
course, dates and status; never personal data beyond that.
Training Management System  |  Architecture & Delivery Roadmap
UX and UI design
Confidential - Internal use
39

## Page 40

8
Application engineering
Code structure, conventions and performance
Repository structure
 tms/
  prisma/
    schema.prisma
    migrations/                 # generated + hand-written SQL (constraints, views)
    seed/                       # dev seed: 10k fake employees for performance work
  src/
    app/                        # Next.js App Router (routing and composition only)
      (auth)/login, set-password
      (me)/                     # participant area
      (teacher)/teacher/
      (admin)/admin/
      (manager)/branch/
      verify/[token]/           # public certificate verification
      api/auth/[...all]/        # Better Auth handler
      api/webhooks/, api/exports/
    modules/                    # business logic: one folder per domain module
      identity/ org/ catalog/ batches/ enrollment/ attendance/
      materials/ compliance/ evaluation/ cascade/ reports/ notifications/ audit/
        service.ts              # use-cases, transactions, state machines
        repo.ts                 # Prisma access with scope filters
        schema.ts               # Zod input/output schemas
        policy.ts               # resource-level rules
        events.ts               # domain events -> jobs
    lib/                        # auth, db, storage, mailer, queue, i18n, logger, env
    components/                 # ui/ (shadcn), shared tables, forms, charts
    worker/                     # pg-boss worker entry and job handlers
  tests/ unit/ integration/ e2e/ authz/
  infra/ docker/ terraform/ k6/
Engineering rules
 Rule
Detail
Thin edges
Server Actions and Route Handlers only authenticate, validate and delegate to a service; no business
logic in components
Module boundaries
A module may call another's service, never its repo; enforce with eslint-plugin-boundaries or
dependency-cruiser
Validation
Zod schemas at every boundary: forms, actions, route handlers, webhook payloads, environment
variables
Typed errors
DomainError with a stable code (BATCH_FULL, NOT_ELIGIBLE); UI maps codes to translated
messages
Transactions
One use-case equals one transaction; enqueue jobs inside it; never call external services inside a DB
transaction
Select what you need
Use select to avoid over-fetching; avoid N+1 by using include or batched queries
Pagination
Keyset (cursor) pagination for long lists; offset only for small admin tables with a hard cap
No magic strings
Enums and constants for statuses, permissions, job names, audit actions
Feature flags
Simple DB or env flags to ship dark and enable per environment
Training Management System  |  Architecture & Delivery Roadmap
Application engineering
Confidential - Internal use
40

## Page 41

Rule
Detail
Config
env.ts parses and validates all environment variables at start-up; the app refuses to boot on bad config
Server Action template
 "use server";
export const enrolAction = safeAction(EnrolSchema, async (input, ctx) => {
  assertCan(ctx, "enrollment", "write");
  const result = await enrollmentService.enrolEmployees(ctx, input.batchId, input.employeeIds);
  revalidateTag(`batch:${input.batchId}`);
  return { ok: true, count: result.length };
});
// lib/safe-action.ts
export function safeAction<S extends z.ZodTypeAny, R>(schema: S, fn: (i: z.infer<S>, c: Ctx) => Promise<R>) {
  return async (raw: unknown) => {
    const ctx = await requireSession();
    const parsed = schema.safeParse(raw);
    if (!parsed.success) return { ok: false, code: "VALIDATION", issues: parsed.error.flatten() };
    try { return await fn(parsed.data, ctx); }
    catch (e) {
      if (e instanceof DomainError) return { ok: false, code: e.code };
      logger.error({ err: e, requestId: ctx.requestId }, "unhandled action error");
      return { ok: false, code: "INTERNAL" };
    }
  };
}
Background jobs
 Job
Trigger
Notes
email.send
Event
Retry with exponential back-off; dead-letter after 5 attempts;
idempotency key
reminders.scan
Every 15 min
Finds sessions at 7 d / 1 d / 1 h; sends once per recipient and
window
compliance.evaluate
Nightly 01:00 Asia/Dhaka plus on
employee events
Creates assignments, flips overdue, creates renewals
batch.finalise
Batch end or admin action
Computes results; issues certificates; creates cascade tasks
certificate.render
After issue
Generates PDF with QR; stores in object storage
files.scan
After upload
ClamAV; marks CLEAN or INFECTED; notifies uploader
import.employees
Admin upload
Row-level validation; produces an error report; all-or-nothing
option
report.export
Admin request
Streams large CSV/XLSX to storage; e-mails an expiring link
reports.refresh
Nightly 02:00
Refreshes materialised views concurrently
cascade.escalate
Daily
Reminders and manager escalation
housekeeping
Nightly
Purge expired sessions, tokens, old e-mail payloads
Training Management System  |  Architecture & Delivery Roadmap
Application engineering
Confidential - Internal use
41

## Page 42

Performance practice
 - Connection pooling: PgBouncer (transaction mode) in front of PostgreSQL; a small Prisma pool per app
instance.
- Caching: cache static reference data (branches, designations, course catalogue) with tags; never cache per-user
or authorised data in shared caches.
- Streaming UI: Suspense boundaries and loading skeletons so dashboards render progressively.
- Query review: run EXPLAIN ANALYZE on every report query; enable pg_stat_statements; fail CI on missing
indexes for new filters.
- Assets: next/image, font subsetting, route-level code splitting; budget of 200 KB JavaScript on participant pages.
- Bulk work: imports and exports run in the worker with batching of 500 rows; never in a request.
BEST PRACTICE
Seed a staging database with about 10,000 employees and several years of history from day one. Many performance
problems only show at realistic volume.
Training Management System  |  Architecture & Delivery Roadmap
Application engineering
Confidential - Internal use
42

## Page 43

9
Reporting and analytics
Answering who, what, when and how long ago
Reporting is the main reason the system exists. The design goal is that every report is a filtered,
paginated query over indexed tables, with heavy aggregates precomputed overnight and large
exports produced in the background.
OLTP tables
enrolment · attendance
 compliance
Nightly job
REFRESH CONCURRENTLY
Materialised views
employee_training_
 summary
Report service
filters · paging
 authz scope
Tables + charts
Export job
CSV / XLSX
Object storage
signed link, 24 h
Email link to
 requester
Start with indexed live queries; add a materialised view only for the heavy “who attended what and how long ago” rollups.
Figure 20. Reporting pipeline. Interactive reports query indexed tables or materialised views; exports run as background jobs and arrive
 as expiring links.
Report catalogue
 Report
Audience
Key filters
Answers
Employee transcript
Participant, admin,
manager
Employee, status, date
Every training, completion date, how
long ago, score, certificate status
Participation by course
/ batch
Admin
Course, batch, branch,
department, date range
Who attended which training
Not trained in N months
Admin, manager
Course, months, branch,
designation
Who has never done, or not refreshed, a
course
Compliance status
Admin, manager,
auditor
Rule, branch, designation,
status
Compliant, due soon, overdue, expiring,
exempt
Attendance and
no-show
Admin
Batch, trainer, branch
Attendance rate, late arrivals, no-shows,
waitlist
Trainer scorecard
Admin; trainer (own,
aggregated)
Trainer, course, period
Ratings by category, trend, response
count
Cascade completion
Admin, manager
Branch, course, status
Tasks on time, colleagues reached,
overdue
Batch utilisation
Admin
Period, venue, course
Seat fill rate, cancellations, venue use
Certificate register
Admin, auditor
Status, expiry window
Issued, revoked, expiring certificates
Audit trail
Admin, auditor
Entity, actor, date
Who changed what and when
Training Management System  |  Architecture & Delivery Roadmap
Reporting and analytics
Confidential - Internal use
43

## Page 44

How 'how long ago' is defined
A single, documented definition avoids arguments in review meetings: last completed date is the latest
completedAt of an enrolment with status COMPLETED for that course. 'Months ago' is calendar months between
that date and today in Asia/Dhaka. Failed, no-show and withdrawn attempts do not count as completion.
-- Appendix B: precomputed summary (refreshed nightly, CONCURRENTLY)
CREATE MATERIALIZED VIEW employee_training_summary AS
SELECT en."employeeId", b."courseId",
       max(en."completedAt") AS last_completed_at,
       count(*)              AS times_completed
FROM enrollment en JOIN batch b ON b.id = en."batchId"
WHERE en.status = 'COMPLETED'
GROUP BY en."employeeId", b."courseId";
CREATE UNIQUE INDEX employee_training_summary_pk ON employee_training_summary ("employeeId", "courseId");
Report UX and delivery rules
 - Server-side filtering, sorting and pagination; column chooser; saved views per user.
- Exports stream to CSV or XLSX in the worker; the file is stored privately and linked by a signed URL that expires
in 24 hours.
- Every export is logged (who, filters, row count) and large or sensitive exports can require a second admin's
approval.
- Row-level scope applies to exports exactly as to screens; a branch manager cannot export other branches.
- Show the data freshness time on every materialised-view report ('updated 02:10').
Training Management System  |  Architecture & Delivery Roadmap
Reporting and analytics
Confidential - Internal use
44

## Page 45

10
Security and privacy
Threat model, controls and compliance
The system holds personal data, performance information and compliance evidence. Security is
therefore designed in, not added later. The baseline is OWASP ASVS Level 2, with the controls below
mapped to the most likely threats.
Threat model
 Threat
Example
Primary controls
Credential stuffing
Leaked passwords tried against
logins
Rate limit, lockout, breached-password check, 2FA for privileged
roles
Broken access control
(IDOR)
Changing an id in a URL to read
another branch
Scoped queries, 404 for out-of-scope, UUIDv7, automated
authorisation tests
Check-in fraud
QR photo sent to an absent
colleague
30-second rotating signed token, time window, enrolment check,
audit, optional geofence
Malicious upload
Infected PDF or script disguised
as slides
Type allow-list, content sniffing, ClamAV quarantine, attachment
disposition, private bucket
Cross-site scripting
Script in a cascade summary
React escaping, strict CSP, sanitise any rich text, no
dangerouslySetInnerHTML
CSRF
Forged request from another
site
SameSite cookies, origin checks (built into Server Actions), trusted
origins list
Injection
SQL through a search box
Prisma parameterisation; raw SQL only via tagged templates; Zod
validation
Data leakage through
exports
Bulk download by a
compromised admin
Scope on exports, audit, approvals for large exports, alerting on
volume
Insider misuse
Admin edits attendance to pass
someone
Override requires reason, full audit with before/after, monthly review
report
De-anonymising
evaluations
Trainer infers who wrote a
comment
Minimum 5 responses, no identity in trainer queries, aggregate
views in the database
Supply-chain
compromise
Malicious npm package
Lockfile, exact pins, Renovate, dependency scanning, SBOM, no
install scripts by default
Denial of service
Flood of check-in requests
CDN/WAF rate limits, per-user and per-IP limits, bounded queries
Secret exposure
Key committed to Git
Secret manager, gitleaks pre-commit and CI scan, short-lived
credentials
Training Management System  |  Architecture & Delivery Roadmap
Security and privacy
Confidential - Internal use
45

## Page 46

Security headers
 // next.config.ts
const headers = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options",    value: "nosniff" },
  { key: "Referrer-Policy",           value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy",        // camera is needed for QR scanning
    value: "camera=(self), microphone=(), geolocation=(self)" },
  { key: "X-Frame-Options",           value: "DENY" },
  { key: "Content-Security-Policy",   value:
      "default-src 'self'; img-src 'self' data: blob: https://<bucket-host>; " +
      "script-src 'self' 'nonce-{NONCE}'; style-src 'self' 'unsafe-inline'; " +
      "connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'" },
];
export default { async headers() { return [{ source: "/(.*)", headers }]; } };
Rate limiting
 Endpoint
Limit
Key
Sign-in
10 per minute; 5 failures locks 15 min
IP + e-mail
Password reset request
3 per hour
E-mail + IP
Check-in (QR / code)
5 per minute
User + IP
Public certificate verify
30 per minute
IP
Search / type-ahead
60 per minute
User
Export request
5 per hour
User
Privacy and data protection
 - Data minimisation: store only what training administration needs. The public verification page shows name,
course, dates and status, nothing else.
- Classification: treat employee identity, contact details, performance and evaluation comments as confidential;
encrypt in transit (TLS 1.2+) and at rest (database and bucket encryption).
- Access reviews: quarterly review of admin and manager accounts; remove access on role change.
- Subject requests: be able to export and, where law permits, correct an individual's data; legal retention overrides
deletion.
- Local law: confirm applicable Bangladesh data-protection and sector-regulator requirements with legal and
compliance before launch, including hosting location.
- Logs: never log passwords, tokens, QR secrets or full request bodies; mask e-mail and phone in application logs.
Secure development lifecycle
 Stage
Activity
Design
Threat modelling for each new module; review of authorisation matrix
Code
Strict TypeScript, ESLint security rules, pre-commit secret scan, mandatory review
Build
Dependency audit, container scan (Trivy), CodeQL or Semgrep static analysis, SBOM
Test
Authorisation matrix tests, DAST scan on staging (OWASP ZAP), fuzz imports and uploads
Release
Independent penetration test before go-live and annually; fix critical and high findings first
Operate
Alert on anomalies; incident response runbook; post-incident reviews; vulnerability patch SLA (critical 72 h)
Training Management System  |  Architecture & Delivery Roadmap
Security and privacy
Confidential - Internal use
46

## Page 47

11
DevOps and reliability
Pipeline, environments, observability and recovery
Delivery pipeline
Pull request
Lint +
typecheck
Unit tests
Integration
(Testcontainers
 Postgres)
Build +
prisma migrate
 diff
Dep audit +
SAST + secrets
 scan
Review +
approval
CONTINUOUS INTEGRATION
Merge main
Deploy staging
migrate deploy
Playwright E2E
+ smoke tests
Manual approval
(release owner)
Deploy production
migrate then app
Health check + synthetic login
Fail → auto rollback + alert on-call
fail
Database migrations are forward-only and backwards-compatible (expand → migrate → contract) so a rollback never needs a schema rollback.
 Figure 21. CI/CD pipeline. Every merge request runs the full quality gate; only a green main branch deploys to staging, and production
 needs approval.
RELEASE 1 · MVP (weeks 1-10)
Auth, roles, forced password change
Employee import + org structure
Courses, batches, sessions, venues
Admin enrolment + waitlist
Email + .ics + reminders
QR / code / manual attendance
Certificates + verification page
Materials with virus scan
Participant transcript
Audit log
RELEASE 2 · GOVERNANCE (weeks 11-18)
Compliance rules + dashboards
Renewals + exemptions
Speaker + course evaluation
Learn-in-branch workflow
Branch manager role
Report pages + Excel/CSV export
2FA for admins
Bangla / English UI
Hardening + pilot + go-live
RELEASE 3 · SCALE (after launch)
Quizzes + pre/post assessment
Budget + cost tracking
Training-needs requests
SSO (Entra / Google)
Zoom / Meet / Teams webhooks
PWA + offline check-in
HR system API sync
Skills matrix + career paths
AI-assisted recommendations
 Figure 22. Release flow with expand-and-contract migrations, health-checked rollout and a documented rollback path.
Training Management System  |  Architecture & Delivery Roadmap
DevOps and reliability
Confidential - Internal use
47

## Page 48

Environments
 Environment
Purpose
Data
Deploy
Local
Developer machine via Docker Compose
Seed data (fake)
Manual
CI
Automated tests with Testcontainers PostgreSQL
Ephemeral
Per pull request
Preview (optional)
Per-PR environment for design review
Seed data
Automatic
Staging
Production-like for UAT, load and security tests
Masked copy or large
synthetic set
Automatic from
main
Production
Live service
Real
Approved release,
health-gated
RISK
Never copy raw production data into staging or developer machines. Use masked or synthetic data; employee records
are personal data.
Observability
 Signal
Tooling
What to capture
Logs
pino JSON to stdout, shipped to a central
store
Request id, user id (hashed), module, duration, error code; no
secrets
Errors
Sentry (web and worker)
Release version, user role, breadcrumbs; alerts on new issues
Metrics
OpenTelemetry to Prometheus/Grafana or
a hosted APM
Latency, error rate, queue depth, job duration, DB pool, e-mail
delivery
Traces
OpenTelemetry
End-to-end trace for enrolment, check-in and finalisation
Uptime
External synthetic checks of /health and a
login journey
Availability, TLS expiry
Business
Dashboards from the database
Enrolments per day, check-ins, overdue compliance, failed e-mails
Service-level objectives and alerts
 SLO
Target
Alert when
Availability (business hours)
99.9 %
Error budget burn > 2x over 1 hour
Page latency p95
< 500 ms
> 800 ms for 10 minutes
Check-in success
> 99.5 %
< 98 % during an open session
E-mail queue age
< 5 minutes
Oldest queued job > 15 minutes
Job failures
< 1 %
Any dead-lettered job
Database
CPU < 70 %, disk < 80 %
Thresholds exceeded; replication lag > 30 s
Training Management System  |  Architecture & Delivery Roadmap
DevOps and reliability
Confidential - Internal use
48

## Page 49

Backup and disaster recovery
 Item
Approach
Objective
Database
Continuous WAL archiving for point-in-time recovery plus daily base backup;
cross-zone replica
RPO ≤ 15 min
Object storage
Versioning enabled; cross-region or cross-site replication of certificates and
evidence
No silent loss
Configuration and
secrets
Infrastructure as code in Git; secrets in a manager with its own backup
Rebuild from scratch
Restore drill
Quarterly full restore to an isolated environment, verified by checksums and
smoke tests
RTO ≤ 4 h proven, not
assumed
Disaster scenario
Documented runbook for region or site loss; contact tree; decision criteria
Annual tabletop exercise
BEST PRACTICE
A backup that has never been restored is only a hope. Schedule the restore drill and record the measured time.
Container and health check
 # Dockerfile (multi-stage, non-root)
FROM node:lts-slim AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile
FROM deps AS build
COPY . .
RUN pnpm prisma generate && pnpm build
FROM node:lts-slim AS run
ENV NODE_ENV=production TZ=UTC
WORKDIR /app
RUN useradd -r -u 1001 app
COPY --from=build --chown=app /app/.next/standalone ./
COPY --from=build --chown=app /app/.next/static ./.next/static
USER app
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s \
  CMD node -e "fetch('http://localhost:3000/health').then(r=>process.exit(r.ok?0:1))"
CMD ["node", "server.js"]
// app/health/route.ts - liveness vs readiness
export async function GET() {
  await prisma.$queryRaw`SELECT 1`;               // readiness: database reachable
  return Response.json({ status: "ok", version: process.env.APP_VERSION });
}
Operational runbooks to write before go-live
 - Restore the database to a point in time
- Roll back a release and a migration
- E-mail provider outage or bounce spike
- Stuck or dead-lettered jobs
- Bulk account creation and password-reset failures
- Suspected account compromise
- Check-in failure during a live session (fallback to manual roster)
- Certificate revocation and re-issue
Training Management System  |  Architecture & Delivery Roadmap
DevOps and reliability
Confidential - Internal use
49

## Page 50

12
Quality engineering
Testing strategy and release gates
E2E (Playwright)
 ~15 critical journeys
Integration + authz matrix
real PostgreSQL, every endpoint × every role
Unit tests
rules engine · attendance maths · policies · validators
Also required
Contract tests for server actions (Zod schemas)
Load test: 10 k users, 500 concurrent check-ins
Accessibility: axe in CI + manual keyboard pass
Security: dependency audit, SAST, DAST on staging
Restore drill: backup → fresh DB → smoke test
Migration test: apply on a copy of production
 Figure 23. Test pyramid. Most checks are fast unit and integration tests; a small set of end-to-end journeys covers the critical flows.
Test type
Tooling
Scope
Unit
Vitest
Pure logic: rule scope matching, attendance percentage, token
signing, state machines, date calculations
Integration
Vitest and Testcontainers (real
PostgreSQL)
Services with the database: capacity under concurrency,
constraints, finalisation idempotency, migrations
Authorisation
matrix
Vitest or Playwright API
Every endpoint called as each role; asserts 200, 403 or 404 exactly
as the matrix says
End-to-end
Playwright
Enrol, accept, check in, complete, certificate, evaluate, cascade
submit and approve; Bangla locale smoke test
Accessibility
axe in Playwright; manual
screen-reader pass
All key pages meet WCAG 2.2 AA
Performance
k6
500 concurrent check-ins; 200 concurrent report users; export of
100,000 rows
Security
ZAP, Semgrep, dependency scan,
penetration test
OWASP Top 10 and ASVS L2 checks
Migration
Dry run on production-sized copy
Expand and contract steps, lock time, rollback
UAT
Pilot branches with real staff
Scripted scenarios signed off by the training centre
Training Management System  |  Architecture & Delivery Roadmap
Quality engineering
Confidential - Internal use
50

## Page 51

Authorisation matrix test (pattern)
 // tests/authz/matrix.test.ts
const cases = [
  // [action,                       participant, teacher, manager, admin]
  ["GET  /api/batches/:other",      404,         404,     404,     200],
  ["POST attendance.mark",          403,         200,     403,     200],
  ["POST enrollment.create",        403,         403,     403,     200],
  ["GET  report.branch(other)",     404,         404,     404,     200],
  ["GET  evaluation.comments",      403,         403,     403,     200],
] as const;
describe.each(cases)("%s", (name, ...expected) => {
  it.each(ROLES)("as %s", async (role, i) => {
    const res = await callAs(role, name);
    expect(res.status).toBe(expected[i]);
  });
});
Quality gates (a merge or release is blocked unless all pass)
 Gate
Threshold
Type check and lint
Zero errors, zero warnings on changed files
Unit and integration tests
100 % pass; coverage at least 80 % in rule, attendance, enrolment and authorisation
modules
Authorisation matrix
100 % pass
End-to-end smoke
Critical journeys pass on staging before production
Dependency and container scan
No critical or high vulnerabilities without a documented exception
Accessibility
No serious or critical axe violations on key pages
Bundle budget
Participant pages under the JavaScript budget
Migration check
Applies cleanly on empty and production-like databases
Test data
A seed script generates 10,000 employees across 100+ branches, 300 courses, 5 years of batches and realistic
attendance and compliance states. It is used for performance testing, demos and training. It must never include real
personal data.
Training Management System  |  Architecture & Delivery Roadmap
Quality engineering
Confidential - Internal use
51

## Page 52

13
Delivery roadmap
Phases, team, risks and go-live
Eighteen-week plan
 PHASE
W1
W2
W3
W4
W5
W6
W7
W8
W9
W10
W11
W12
W13
W14
W15
W16
W17
W18
0 Foundation
1 Identity + org
2 Catalogue + scheduling
3 Enrolment + notifications
4 Attendance + certificates
5 Materials
6 Compliance rules
7 Evaluation + cascade
8 Reporting
9 Hardening + pilot + launch
Continuous streams
Security + authz tests
QA automation
UX review + design system
Docs + admin training
M1
M2
M3
M4
M5
◆ M1 Auth + org ready (W3)
◆ M2 Enrolment + email demo (W7)
◆ M3 UAT round 1 (W10)
◆ M4 Feature complete (W14)
◆ M5 Go-live (W18)
 Figure 24. Delivery roadmap. Phases overlap where dependencies allow; the pilot begins in week 17 and the full rollout in week 19
 onward.
Phase
Weeks
Deliverables
Exit criteria
0. Foundation
1
Repository, Docker, CI, Prisma baseline, environment
validation, Sentry, role-based UI shell, design tokens
Pipeline green; hello-world
deployed to staging
1. Identity and
organisation
2
Better Auth with admin and access control, forced
password change, branches, departments, designations,
employee CRUD and CSV import, account creation, audit
log
Import of a 10k-row file with error
report; authorisation tests running
2. Catalogue and
scheduling
2
Courses, categories, prerequisites, venues, trainers,
batches, sessions, overlap constraints, calendar
Admin can plan a multi-session
batch; clashes blocked
3. Enrolment and
notifications
2
Admin enrolment, capacity and waitlist, queue,
templates, .ics, reminders, confirm/decline, in-app inbox
500 invitations delivered;
concurrency test passes
4. Attendance and
completion
2
QR and code check-in, roster, overrides, finalisation,
certificates and verification page, transcript
Live pilot session end to end
5. Materials
1
Presigned upload, antivirus, access rules, versioning,
signed downloads
Infected test file is quarantined
Training Management System  |  Architecture & Delivery Roadmap
Delivery roadmap
Confidential - Internal use
52

## Page 53

Phase
Weeks
Deliverables
Exit criteria
6. Compliance rules
2
Rule builder, scope engine, nightly job, dashboards,
exemptions, renewals
Rules reproduce a known manual
compliance list
7. Evaluation and
cascade
2
Templates, windows, anonymity threshold, cascade task,
evidence upload, review and escalation
Threshold enforced; cascade
approved in UAT
8. Reporting
2
Report pages, materialised views, exports, saved views
All catalogue reports pass UAT
with real data
9. Hardening and
launch
2
Load and security tests, penetration test fixes, restore
drill, monitoring, training, pilot, rollout
Go-live checklist signed
TIP
If the schedule must shrink, defer materialised views, certificate PDF polish and Bangla translation of rarely used
screens. Never defer the audit log, the authorisation tests or the restore drill.
Team
 Role
FTE
Responsibility
Product owner (training centre)
0.5
Priorities, acceptance, UAT, stakeholder communication
Tech lead / architect
1.0
Architecture, code review, security and data model ownership
Full-stack engineers
2-3
Feature delivery across UI, services and database
UI / UX designer
0.5
Design system, screens, accessibility, usability tests
QA / test engineer
1.0
Test strategy, automation, UAT support, performance tests
DevOps / SRE
0.5
Pipeline, infrastructure, observability, backup and recovery
Project manager
0.5
Plan, risks, dependencies, reporting
Risk register
 Risk
Likelihood
Impact
Mitigation
Employee master data is incomplete
or inconsistent
High
High
Early import trial; data-cleaning sprint; HR owner assigned;
validation reports
Scope creep from new rule or report
requests
High
Medium
Change-control board; MoSCoW; phase backlog
Low adoption by participants and
trainers
Medium
High
Pilot, short videos, champions in each branch,
mobile-friendly flows
Poor connectivity at some branches
Medium
Medium
Lightweight pages; manual roster fallback; PWA later
E-mail deliverability problems
Medium
High
Authenticated domain (SPF, DKIM, DMARC); warm-up;
bounce handling; in-app fallback
Authorisation bug leaks data
Low
High
Scoped repositories; matrix tests; penetration test; code
review checklist
Key-person dependency
Medium
Medium
Documentation, pair programming, ADRs, runbooks
Hosting or data-residency constraint
discovered late
Medium
High
Decide hosting in phase 0 with compliance sign-off
Training Management System  |  Architecture & Delivery Roadmap
Delivery roadmap
Confidential - Internal use
53

## Page 54

Definition of done
 - Acceptance criteria met and demonstrated to the product owner.
- Unit, integration and authorisation tests written and passing.
- Audit events recorded for sensitive actions.
- Accessible by keyboard; axe clean; English and Bangla strings present.
- Logs, metrics and error handling in place; runbook updated if operations change.
- Documentation and changelog updated; migration reviewed.
Go-live checklist
 Area
Checks
Data
Employees imported and reconciled with HR; historic training loaded; duplicates resolved
Accounts
Accounts created; welcome e-mails tested; admins have 2FA
Security
Penetration test findings closed; headers verified; secrets rotated; rate limits active
Reliability
Load test passed; restore drill timed; alerts routed to on-call; status page ready
E-mail
SPF, DKIM, DMARC valid; templates reviewed in English and Bangla; .ics tested in major calendars
Compliance
Rules verified against the manual list; retention policy approved; privacy notice published
People
Admins, trainers and branch managers trained; support channel and escalation path agreed
Rollback
Rollback plan rehearsed; legacy spreadsheets kept read-only for 90 days
Rollout and change management
 - Pilot: two or three branches and one or two live batches; daily feedback; fix before widening.
- Waves: roll out region by region in four waves, two weeks apart, with a branch champion trained in each.
- Training: a 30-minute session and a one-page guide for each role; short videos in Bangla and English; in-app
tips for first use.
- Support: a named help channel, a response target (same business day), and a weekly review of top issues.
- Legacy data: migrate historical records with a documented mapping; keep source files and a reconciliation
report.
After launch: next releases
 Release
Candidate features
Next quarter
Zoom / Meet / Teams attendance import; PWA check-in; quizzes and pre/post assessments
Following quarter
Training budget and cost tracking; training-needs requests from branch managers; SSO
Longer term
Skills matrix and career paths; recommendation of courses; learning analytics; mobile app if PWA is
insufficient
Training Management System  |  Architecture & Delivery Roadmap
Delivery roadmap
Confidential - Internal use
54

## Page 55

A
Prisma schema
Complete corrected schema (also supplied as schema.prisma)
Generate the Better Auth models with npx @better-auth/cli generate and reconcile them with the first four
models below. Prisma 6 or later is assumed for uuid(7); verify the extensions preview feature against your Prisma
version.
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}
datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  extensions = [citext, pg_trgm, btree_gist]
}
// ============ ENUMS ============
enum EmployeeStatus    { ACTIVE ON_LEAVE SUSPENDED RESIGNED RETIRED }
enum DeliveryMode      { ONSITE ONLINE HYBRID }
enum CourseStatus      { DRAFT ACTIVE ARCHIVED }
enum BatchStatus       { DRAFT PUBLISHED ENROLLMENT_CLOSED IN_PROGRESS COMPLETED CANCELLED }
enum TrainerRole       { LEAD CO_TRAINER GUEST }
enum EnrollmentStatus  { INVITED CONFIRMED WAITLISTED DECLINED WITHDRAWN COMPLETED FAILED NO_SHOW }
enum AttendanceStatus  { PRESENT LATE ABSENT EXCUSED }
enum AttendanceMethod  { SELF_QR SELF_CODE ONLINE_JOIN MANUAL }
enum MaterialKind      { FILE LINK VIDEO }
enum MaterialAccess    { ENROLLED AFTER_COMPLETION ALL_EMPLOYEES }
enum ScanStatus        { PENDING CLEAN INFECTED }
enum ComplianceTrigger { ON_JOIN ON_PROMOTION ONE_TIME RECURRING }
enum ComplianceStatus  { PENDING SATISFIED OVERDUE EXPIRED EXEMPT }
enum QuestionType      { RATING TEXT YES_NO }
enum CascadeStatus     { ASSIGNED SUBMITTED REVISION_REQUESTED APPROVED OVERDUE WAIVED }
enum EmailStatus       { QUEUED SENT FAILED BOUNCED }
// ============ BETTER AUTH (npx @better-auth/cli generate) ============
model User {
  id                 String    @id
  name               String
  email              String    @unique
  emailVerified      Boolean   @default(false)
  image              String?
  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt
  role               String?   @default("participant")
  banned             Boolean?  @default(false)
  banReason          String?
  banExpires         DateTime?
  mustChangePassword Boolean   @default(true)
  sessions Session[]
  accounts Account[]
  employee Employee?
  trainer  TrainerProfile?
  @@map("user")
}
model Session {
  id             String   @id
  expiresAt      DateTime
  token          String   @unique
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  ipAddress      String?
  userAgent      String?
  userId         String
  impersonatedBy String?
  user           User     @relation(fields: [userId], references: [id], onDelete: Cascade)
Training Management System  |  Architecture & Delivery Roadmap
Prisma schema
Confidential - Internal use
55

## Page 56

@@index([userId])
  @@map("session")
}
model Account {
  id                    String    @id
  accountId             String
  providerId            String
  userId                String
  accessToken           String?
  refreshToken          String?
  idToken               String?
  accessTokenExpiresAt  DateTime?
  refreshTokenExpiresAt DateTime?
  scope                 String?
  password              String?
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([userId])
  @@map("account")
}
model Verification {
  id         String   @id
  identifier String
  value      String
  expiresAt  DateTime
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  @@index([identifier])
  @@map("verification")
}
// ============ ORGANISATION ============
model Branch {
  id        String   @id @default(uuid(7))
  code      String   @unique
  name      String
  parentId  String?
  district  String?
  address   String?
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  parent    Branch?    @relation("BranchTree", fields: [parentId], references: [id])
  children  Branch[]   @relation("BranchTree")
  employees Employee[]
  venues    Venue[]
  scopes    ComplianceRuleScope[]
  @@map("branch")
}
model Department {
  id        String  @id @default(uuid(7))
  code      String  @unique
  name      String
  isActive  Boolean @default(true)
  employees Employee[]
  scopes    ComplianceRuleScope[]
  @@map("department")
}
model Designation {
  id        String  @id @default(uuid(7))
  code      String  @unique
  title     String
  grade     Int
  isActive  Boolean @default(true)
  employees Employee[]
  scopes    ComplianceRuleScope[]
  @@map("designation")
}
model Employee {
Training Management System  |  Architecture & Delivery Roadmap
Prisma schema
Confidential - Internal use
56

## Page 57

id             String         @id @default(uuid(7))
  employeeNo     String         @unique
  userId         String?        @unique
  fullName       String
  workEmail      String         @unique @db.Citext
  phone          String?
  branchId       String
  departmentId   String
  designationId  String
  managerId      String?
  joinedOn       DateTime       @db.Date
  lastPromotedOn DateTime?      @db.Date
  status         EmployeeStatus @default(ACTIVE)
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt
  deletedAt      DateTime?
  user        User?       @relation(fields: [userId], references: [id])
  branch      Branch      @relation(fields: [branchId], references: [id])
  department  Department  @relation(fields: [departmentId], references: [id])
  designation Designation @relation(fields: [designationId], references: [id])
  manager     Employee?   @relation("Manager", fields: [managerId], references: [id])
  reports     Employee[]  @relation("Manager")
  enrollments    Enrollment[]
  compliance     ComplianceAssignment[]
  cascadeTasks   CascadeTask[]
  cascadeAttends CascadeAttendee[]
  @@index([branchId, status])
  @@index([departmentId, status])
  @@index([designationId])
  @@index([managerId])
  @@map("employee")
}
model TrainerProfile {
  id           String   @id @default(uuid(7))
  userId       String?  @unique
  name         String
  email        String?  @db.Citext
  organization String?
  isExternal   Boolean  @default(false)
  bio          String?
  expertise    String[]
  isActive     Boolean  @default(true)
  user        User?          @relation(fields: [userId], references: [id])
  batches     BatchTrainer[]
  evaluations Evaluation[]
  @@map("trainer_profile")
}
model Venue {
  id       String  @id @default(uuid(7))
  name     String
  branchId String?
  capacity Int
  address  String?
  isActive Boolean @default(true)
  branch   Branch?           @relation(fields: [branchId], references: [id])
  batches  Batch[]
  sessions TrainingSession[]
  @@map("venue")
}
// ============ CATALOGUE & SCHEDULING ============
model CourseCategory {
  id      String   @id @default(uuid(7))
  name    String   @unique
  courses Course[]
  @@map("course_category")
}
model Course {
  id               String       @id @default(uuid(7))
Training Management System  |  Architecture & Delivery Roadmap
Prisma schema
Confidential - Internal use
57

## Page 58

code             String       @unique
  title            String
  description      String?
  categoryId       String?
  defaultMode      DeliveryMode @default(ONSITE)
  durationHours    Decimal      @db.Decimal(5, 1)
  validityMonths   Int?
  minAttendancePct Int          @default(80)
  passScore        Int?
  requiresCascade  Boolean      @default(false)
  cascadeDueDays   Int          @default(30)
  status           CourseStatus @default(DRAFT)
  createdAt        DateTime     @default(now())
  updatedAt        DateTime     @updatedAt
  category      CourseCategory?        @relation(fields: [categoryId], references: [id])
  batches       Batch[]
  materials     Material[]
  rules         ComplianceRule[]
  assignments   ComplianceAssignment[]
  prerequisites CoursePrerequisite[]   @relation("Course")
  requiredFor   CoursePrerequisite[]   @relation("Required")
  @@index([status, categoryId])
  @@map("course")
}
model CoursePrerequisite {
  courseId         String
  requiredCourseId String
  course           Course @relation("Course", fields: [courseId], references: [id], onDelete: Cascade)
  required         Course @relation("Required", fields: [requiredCourseId], references: [id])
  @@id([courseId, requiredCourseId])
  @@map("course_prerequisite")
}
model Batch {
  id                 String      @id @default(uuid(7))
  code               String      @unique
  courseId           String
  status             BatchStatus @default(DRAFT)
  mode               DeliveryMode
  capacity           Int
  startsAt           DateTime
  endsAt             DateTime
  enrollmentCloses   DateTime?
  venueId            String?
  meetingUrl         String?
  evaluationOpensAt  DateTime?
  evaluationClosesAt DateTime?
  createdById        String
  createdAt          DateTime    @default(now())
  updatedAt          DateTime    @updatedAt
  course      Course            @relation(fields: [courseId], references: [id])
  venue       Venue?            @relation(fields: [venueId], references: [id])
  sessions    TrainingSession[]
  trainers    BatchTrainer[]
  enrollments Enrollment[]
  materials   Material[]
  evaluations Evaluation[]
  @@index([courseId, startsAt])
  @@index([status, startsAt])
  @@map("batch")
}
model BatchTrainer {
  batchId   String
  trainerId String
  role      TrainerRole    @default(LEAD)
  batch     Batch          @relation(fields: [batchId], references: [id], onDelete: Cascade)
  trainer   TrainerProfile @relation(fields: [trainerId], references: [id])
  @@id([batchId, trainerId])
  @@index([trainerId])
  @@map("batch_trainer")
}
Training Management System  |  Architecture & Delivery Roadmap
Prisma schema
Confidential - Internal use
58

## Page 59

// NOTE: named TrainingSession to avoid clashing with Better Auth's Session model
model TrainingSession {
  id              String       @id @default(uuid(7))
  batchId         String
  seq             Int
  title           String?
  mode            DeliveryMode
  startsAt        DateTime
  endsAt          DateTime
  venueId         String?
  meetingUrl      String?
  checkInOpensAt  DateTime?
  checkInClosesAt DateTime?
  checkInCodeHash String?
  qrSecret        String?
  batch      Batch              @relation(fields: [batchId], references: [id], onDelete: Cascade)
  venue      Venue?             @relation(fields: [venueId], references: [id])
  attendance AttendanceRecord[]
  materials  Material[]
  @@unique([batchId, seq])
  @@index([startsAt])
  @@map("training_session")
}
// ============ ENROLMENT, ATTENDANCE, RESULTS ============
model Enrollment {
  id            String           @id @default(uuid(7))
  batchId       String
  employeeId    String
  status        EnrollmentStatus @default(INVITED)
  enrolledById  String
  invitedAt     DateTime         @default(now())
  respondedAt   DateTime?
  declineReason String?
  waitlistPos   Int?
  // snapshot at enrolment time keeps historical reports accurate
  branchId      String
  departmentId  String
  designationId String
  attendancePct Decimal?         @db.Decimal(5, 2)
  score         Decimal?         @db.Decimal(5, 2)
  completedAt   DateTime?
  createdAt     DateTime         @default(now())
  updatedAt     DateTime         @updatedAt
  batch       Batch                  @relation(fields: [batchId], references: [id])
  employee    Employee               @relation(fields: [employeeId], references: [id])
  attendance  AttendanceRecord[]
  certificate Certificate?
  cascadeTask CascadeTask?
  evaluations Evaluation[]
  satisfies   ComplianceAssignment[]
  @@unique([batchId, employeeId])
  @@index([employeeId, status, completedAt(sort: Desc)])
  @@index([batchId, status])
  @@index([completedAt])
  @@index([branchId, completedAt])
  @@map("enrollment")
}
model AttendanceRecord {
  id           String           @id @default(uuid(7))
  sessionId    String
  enrollmentId String
  status       AttendanceStatus
  method       AttendanceMethod
  checkedInAt  DateTime?
  markedById   String?
  note         String?
  createdAt    DateTime         @default(now())
  updatedAt    DateTime         @updatedAt
  session    TrainingSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  enrollment Enrollment      @relation(fields: [enrollmentId], references: [id], onDelete: Cascade)
  @@unique([sessionId, enrollmentId])
  @@index([enrollmentId])
Training Management System  |  Architecture & Delivery Roadmap
Prisma schema
Confidential - Internal use
59

## Page 60

@@map("attendance_record")
}
model Certificate {
  id           String    @id @default(uuid(7))
  enrollmentId String    @unique
  number       String    @unique
  verifyToken  String    @unique
  issuedAt     DateTime  @default(now())
  expiresAt    DateTime?
  fileId       String?
  revokedAt    DateTime?
  enrollment Enrollment @relation(fields: [enrollmentId], references: [id])
  @@index([expiresAt])
  @@map("certificate")
}
// ============ MATERIALS ============
model StoredFile {
  id           String     @id @default(uuid(7))
  storageKey   String     @unique
  fileName     String
  mimeType     String
  sizeBytes    BigInt
  sha256       String
  scanStatus   ScanStatus @default(PENDING)
  uploadedById String
  createdAt    DateTime   @default(now())
  materials    Material[]
  cascadeFiles CascadeSessionFile[]
  @@map("stored_file")
}
model Material {
  id            String         @id @default(uuid(7))
  courseId      String?
  batchId       String?
  sessionId     String?
  title         String
  description   String?
  kind          MaterialKind
  fileId        String?
  url           String?
  access        MaterialAccess @default(ENROLLED)
  version       Int            @default(1)
  isPublished   Boolean        @default(false)
  availableFrom DateTime?
  uploadedById  String
  createdAt     DateTime       @default(now())
  course  Course?          @relation(fields: [courseId], references: [id])
  batch   Batch?           @relation(fields: [batchId], references: [id])
  session TrainingSession? @relation(fields: [sessionId], references: [id])
  file    StoredFile?      @relation(fields: [fileId], references: [id])
  @@index([courseId])
  @@index([batchId])
  @@index([sessionId])
  @@map("material")
}
// ============ MANDATORY TRAINING (RULES) ============
model ComplianceRule {
  id            String            @id @default(uuid(7))
  name          String
  courseId      String
  trigger       ComplianceTrigger
  dueInDays     Int
  renewalMonths Int?
  effectiveFrom DateTime          @db.Date
  effectiveTo   DateTime?         @db.Date
  isActive      Boolean           @default(true)
  createdById   String
  createdAt     DateTime          @default(now())
  course      Course                 @relation(fields: [courseId], references: [id])
Training Management System  |  Architecture & Delivery Roadmap
Prisma schema
Confidential - Internal use
60

## Page 61

scopes      ComplianceRuleScope[]
  assignments ComplianceAssignment[]
  @@index([isActive, trigger])
  @@map("compliance_rule")
}
// A rule applies if ANY scope row matches; within a row ALL non-null fields must match.
// No rows = applies to everyone.
model ComplianceRuleScope {
  id            String    @id @default(uuid(7))
  ruleId        String
  branchId      String?
  departmentId  String?
  designationId String?
  minGrade      Int?
  maxGrade      Int?
  joinedAfter   DateTime? @db.Date
  rule        ComplianceRule @relation(fields: [ruleId], references: [id], onDelete: Cascade)
  branch      Branch?        @relation(fields: [branchId], references: [id])
  department  Department?    @relation(fields: [departmentId], references: [id])
  designation Designation?   @relation(fields: [designationId], references: [id])
  @@index([ruleId])
  @@map("compliance_rule_scope")
}
model ComplianceAssignment {
  id              String           @id @default(uuid(7))
  employeeId      String
  courseId        String
  ruleId          String
  cycle           Int              @default(1)
  assignedOn      DateTime         @db.Date
  dueOn           DateTime         @db.Date
  status          ComplianceStatus @default(PENDING)
  satisfiedById   String?
  satisfiedOn     DateTime?
  expiresOn       DateTime?        @db.Date
  exemptedById    String?
  exemptionReason String?
  updatedAt       DateTime         @updatedAt
  employee    Employee       @relation(fields: [employeeId], references: [id])
  course      Course         @relation(fields: [courseId], references: [id])
  rule        ComplianceRule @relation(fields: [ruleId], references: [id])
  satisfiedBy Enrollment?    @relation(fields: [satisfiedById], references: [id])
  @@unique([employeeId, courseId, cycle])
  @@index([status, dueOn])
  @@index([courseId, status])
  @@index([expiresOn])
  @@map("compliance_assignment")
}
// ============ SPEAKER EVALUATION ============
model EvaluationTemplate {
  id          String               @id @default(uuid(7))
  name        String
  version     Int                  @default(1)
  isActive    Boolean              @default(true)
  questions   EvaluationQuestion[]
  evaluations Evaluation[]
  @@unique([name, version])
  @@map("evaluation_template")
}
model EvaluationQuestion {
  id         String       @id @default(uuid(7))
  templateId String
  position   Int
  category   String
  text       String
  type       QuestionType
  required   Boolean      @default(true)
  scaleMax   Int          @default(5)
  template EvaluationTemplate @relation(fields: [templateId], references: [id], onDelete: Cascade)
Training Management System  |  Architecture & Delivery Roadmap
Prisma schema
Confidential - Internal use
61

## Page 62

answers  EvaluationAnswer[]
  @@unique([templateId, position])
  @@map("evaluation_question")
}
model Evaluation {
  id            String   @id @default(uuid(7))
  batchId       String
  enrollmentId  String
  trainerId     String
  templateId    String
  overallRating Decimal? @db.Decimal(3, 2)
  comment       String?
  submittedAt   DateTime @default(now())
  batch      Batch              @relation(fields: [batchId], references: [id])
  enrollment Enrollment         @relation(fields: [enrollmentId], references: [id])
  trainer    TrainerProfile     @relation(fields: [trainerId], references: [id])
  template   EvaluationTemplate @relation(fields: [templateId], references: [id])
  answers    EvaluationAnswer[]
  @@unique([enrollmentId, trainerId])
  @@index([trainerId, submittedAt])
  @@index([batchId])
  @@map("evaluation")
}
model EvaluationAnswer {
  evaluationId String
  questionId   String
  rating       Int?
  text         String?
  evaluation Evaluation         @relation(fields: [evaluationId], references: [id], onDelete: Cascade)
  question   EvaluationQuestion @relation(fields: [questionId], references: [id])
  @@id([evaluationId, questionId])
  @@map("evaluation_answer")
}
// ============ LEARN IN THE BRANCH (CASCADE) ============
model CascadeTask {
  id             String        @id @default(uuid(7))
  enrollmentId   String        @unique
  employeeId     String
  branchId       String
  status         CascadeStatus @default(ASSIGNED)
  dueOn          DateTime      @db.Date
  targetAudience Int?
  submittedAt    DateTime?
  reviewedById   String?
  reviewedAt     DateTime?
  reviewNote     String?
  createdAt      DateTime      @default(now())
  enrollment Enrollment       @relation(fields: [enrollmentId], references: [id])
  employee   Employee         @relation(fields: [employeeId], references: [id])
  sessions   CascadeSession[]
  @@index([status, dueOn])
  @@index([branchId, status])
  @@index([employeeId])
  @@map("cascade_task")
}
model CascadeSession {
  id          String   @id @default(uuid(7))
  taskId      String
  heldOn      DateTime @db.Date
  durationMin Int
  location    String?
  topic       String
  summary     String
  challenges  String?
  outcome     String?
  task      CascadeTask          @relation(fields: [taskId], references: [id], onDelete: Cascade)
  attendees CascadeAttendee[]
  files     CascadeSessionFile[]
Training Management System  |  Architecture & Delivery Roadmap
Prisma schema
Confidential - Internal use
62

## Page 63

@@index([taskId])
  @@map("cascade_session")
}
model CascadeAttendee {
  sessionId  String
  employeeId String
  session    CascadeSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  employee   Employee       @relation(fields: [employeeId], references: [id])
  @@id([sessionId, employeeId])
  @@index([employeeId])
  @@map("cascade_attendee")
}
model CascadeSessionFile {
  sessionId String
  fileId    String
  kind      String
  session   CascadeSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  file      StoredFile     @relation(fields: [fileId], references: [id])
  @@id([sessionId, fileId])
  @@map("cascade_session_file")
}
// ============ COMMUNICATION & AUDIT ============
model EmailLog {
  id            String      @id @default(uuid(7))
  userId        String?
  toEmail       String
  template      String
  subject       String
  payload       Json
  status        EmailStatus @default(QUEUED)
  attempts      Int         @default(0)
  providerMsgId String?
  error         String?
  scheduledAt   DateTime    @default(now())
  sentAt        DateTime?
  createdAt     DateTime    @default(now())
  @@index([status, scheduledAt])
  @@index([userId, createdAt])
  @@map("email_log")
}
model Notification {
  id        String    @id @default(uuid(7))
  userId    String
  type      String
  title     String
  body      String?
  linkUrl   String?
  readAt    DateTime?
  createdAt DateTime  @default(now())
  @@index([userId, readAt, createdAt(sort: Desc)])
  @@map("notification")
}
model AuditLog {
  id         BigInt   @id @default(autoincrement())
  actorId    String?
  action     String
  entityType String
  entityId   String
  before     Json?
  after      Json?
  ip         String?
  createdAt  DateTime @default(now())
  @@index([entityType, entityId, createdAt])
  @@index([actorId, createdAt])
  @@map("audit_log")
}
Training Management System  |  Architecture & Delivery Roadmap
Prisma schema
Confidential - Internal use
63

## Page 64

B
Raw SQL migration
Constraints, indexes and views Prisma cannot express
Place this file in a separate migration (for example
prisma/migrations/20260101_constraints/migration.sql). Column names are quoted camelCase
because Prisma creates camelCase columns; table names use the @@map values.
-- Extensions (also declared in the Prisma datasource block)
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS btree_gist;
-- Data integrity checks
ALTER TABLE batch ADD CONSTRAINT batch_dates_ck    CHECK ("endsAt" > "startsAt");
ALTER TABLE batch ADD CONSTRAINT batch_capacity_ck CHECK (capacity > 0);
ALTER TABLE training_session ADD CONSTRAINT session_dates_ck CHECK ("endsAt" > "startsAt");
ALTER TABLE course ADD CONSTRAINT course_attendance_ck CHECK ("minAttendancePct" BETWEEN 0 AND 100);
ALTER TABLE evaluation_answer ADD CONSTRAINT answer_one_ck CHECK (rating IS NOT NULL OR text IS NOT NULL);
ALTER TABLE material ADD CONSTRAINT material_scope_ck
  CHECK (num_nonnulls("courseId", "batchId", "sessionId") >= 1);
ALTER TABLE material ADD CONSTRAINT material_payload_ck
  CHECK ((kind = 'FILE' AND "fileId" IS NOT NULL) OR (kind <> 'FILE' AND url IS NOT NULL));
-- No double-booking of a venue (timestamps are UTC "timestamp without time zone")
ALTER TABLE training_session ADD CONSTRAINT venue_no_overlap
  EXCLUDE USING gist ("venueId" WITH =, tsrange("startsAt", "endsAt") WITH &&)
  WHERE ("venueId" IS NOT NULL);
-- Search and hot-path indexes
CREATE INDEX employee_name_trgm ON employee USING gin ("fullName" gin_trgm_ops);
CREATE INDEX enrollment_active_idx ON enrollment ("batchId")
  WHERE status IN ('INVITED', 'CONFIRMED');
CREATE INDEX compliance_open_idx ON compliance_assignment ("dueOn")
  WHERE status IN ('PENDING', 'OVERDUE');
-- Anonymity enforced in the database: trainers can only read groups of 5+ responses
CREATE VIEW trainer_evaluation_summary AS
SELECT e."trainerId", e."batchId",
       count(*)                         AS responses,
       round(avg(e."overallRating"), 2) AS avg_rating
FROM evaluation e
GROUP BY e."trainerId", e."batchId"
HAVING count(*) >= 5;
-- "Who attended what, how long ago" (refresh nightly: REFRESH MATERIALIZED VIEW CONCURRENTLY ...)
CREATE MATERIALIZED VIEW employee_training_summary AS
SELECT en."employeeId", b."courseId",
       max(en."completedAt") AS last_completed_at,
       count(*)              AS times_completed
FROM enrollment en JOIN batch b ON b.id = en."batchId"
WHERE en.status = 'COMPLETED'
GROUP BY en."employeeId", b."courseId";
CREATE UNIQUE INDEX employee_training_summary_pk
  ON employee_training_summary ("employeeId", "courseId");
Training Management System  |  Architecture & Delivery Roadmap
Raw SQL migration
Confidential - Internal use
64

## Page 65

C
Environment variables
Validated at start-up with Zod
Variable
Purpose
Notes
DATABASE_URL
Pooled PostgreSQL connection
(PgBouncer)
Used by the app and worker
DIRECT_URL
Direct connection for migrations
CI/CD only
BETTER_AUTH_SECRET
Signing and encryption secret for auth
32+ random bytes; rotate with a plan
APP_URL
Public base URL; trusted origin
https only in production
S3_ENDPOINT / S3_REGION /
S3_BUCKET
Object storage location
Private bucket; CORS for presigned
upload
S3_ACCESS_KEY_ID /
S3_SECRET_ACCESS_KEY
Object storage credentials
Least privilege; prefer workload
identity
EMAIL_PROVIDER / EMAIL_API_KEY /
EMAIL_FROM
E-mail sending
Domain with SPF, DKIM and DMARC
CLAMAV_HOST / CLAMAV_PORT
Antivirus scanning service
Worker only
QR_SECRET_PEPPER
Extra secret mixed into session QR secrets
Never logged
SENTRY_DSN /
OTEL_EXPORTER_OTLP_ENDPOINT
Error and telemetry export
Different per environment
LOG_LEVEL
Logging verbosity
info in production
TZ
Process time zone
UTC everywhere
APP_VERSION
Release identifier
Set by the pipeline; shown in /health
and Sentry
Training Management System  |  Architecture & Delivery Roadmap
Environment variables
Confidential - Internal use
65

## Page 66

D
Best-practice checklist
A review list for every sprint and release
Area
Checks
Architecture and code
[ ] Module boundaries enforced by lint
[ ] Business rules in services, not components
[ ] Zod at every boundary
[ ] Typed domain errors with stable codes
[ ] One use-case = one transaction; jobs enqueued inside it
[ ] No unbounded queries; every list paginated
Data
[ ] Constraints in the database, not only in code
[ ] Every new filter has an index and an EXPLAIN review
[ ] Snapshots for historical correctness
[ ] Migrations use expand and contract
[ ] UTC storage; Asia/Dhaka display
[ ] Retention and archival rules documented
Security
[ ] Authenticate and authorise in every action and handler
[ ] Scope in queries; 404 for out-of-scope records
[ ] 2FA for admin and manager
[ ] Uploads scanned and served by signed URL
[ ] CSP and security headers verified
[ ] Secrets in a manager; none in Git
UX and accessibility
[ ] One primary action per screen
[ ] Keyboard operable; visible focus
[ ] Errors say what to do next
[ ] Empty, loading and error states designed
[ ] English and Bangla strings complete
[ ] Mobile-first participant flows
Operations
[ ] Health, metrics, logs, traces and alerts live
[ ] Backups restored and timed each quarter
[ ] Runbooks current
[ ] Feature flags for risky changes
[ ] Rollback tested
[ ] Dependencies updated weekly by bot
Process
[ ] Definition of done applied
[ ] Architecture decisions recorded
[ ] Threat model updated for new modules
[ ] Changelog and release notes
[ ] UAT sign-off before production
[ ] Post-incident reviews without blame
Training Management System  |  Architecture & Delivery Roadmap
Best-practice checklist
Confidential - Internal use
66

## Page 67

E
Glossary
Terms used in this book
Term
Meaning
Batch
One scheduled run of a course, with dates, trainers, venue and participants
Session
One meeting within a batch (a three-day batch has three sessions); stored as TrainingSession
Enrolment
The link between an employee and a batch; carries status, attendance percentage, score and
completion date
Cascade
Learn-in-the-branch: a participant teaches colleagues after training and reports it
Compliance rule
A definition of which employees must complete which course, by when, and how often to renew
Assignment
A rule applied to one employee for one cycle; the thing reports and reminders use
Snapshot
Copy of branch, department and designation stored on the enrolment at that time
Scope (data)
The set of rows a user may see, built into the database query
Policy
A rule deciding whether a user may act on a specific record
Idempotent
Safe to run more than once with the same effect as running once
Expand and contract
Schema-change method that adds first, migrates, then removes, enabling zero downtime
RPO / RTO
Maximum tolerable data loss / time to restore service
SLO
Service-level objective: a measurable reliability target
ASVS
OWASP Application Security Verification Standard
PITR
Point-in-time recovery from WAL archives
Training Management System  |  Architecture & Delivery Roadmap
Glossary
Confidential - Internal use
67

## Page 68

F
References and inspiration
Where to learn more and what to study
Official documentation
 Topic
Where to look
Next.js App Router, Server Actions
nextjs.org/docs
Prisma ORM, migrations, PostgreSQL
prisma.io/docs
Better Auth, admin and access-control plugins
better-auth.com/docs
PostgreSQL (constraints, exclusion, PITR)
postgresql.org/docs
pg-boss job queue
github.com/timgit/pg-boss
Tailwind CSS, shadcn/ui, Radix
tailwindcss.com, ui.shadcn.com, radix-ui.com
Security: ASVS and Top 10
owasp.org
Accessibility: WCAG 2.2
w3.org/TR/WCAG22
Password guidance
NIST SP 800-63B
Operations: twelve-factor app; SRE practice
12factor.net; sre.google/books
Products worth studying for UX ideas
Use these for workflow and layout inspiration only. Review them in your browser; do not copy proprietary designs.
Product type
Examples
What to observe
Enterprise learning
platforms
Cornerstone, Docebo, SAP SuccessFactors
Learning, Workday Learning, Absorb, TalentLMS
Assignment rules, transcripts, compliance
dashboards, certificate expiry
Open-source LMS
Moodle, Open edX
Course and activity structure, attendance and
gradebook concepts
Modern admin dashboards
Vercel, Linear, Stripe Dashboard
Density, filters, command palette, empty states,
keyboard use
Component galleries
shadcn/ui examples, Tailwind UI
Data tables, forms, dialogs, dashboards
Event check-in apps
Eventbrite organiser app, Luma
Fast QR scan flow and live attendee counts
DECISION
Next step. Hold a two-hour kickoff to confirm hosting, name the product owner and HR data owner, and approve the
phase plan. Phase 0 can then start the following Monday.
Training Management System  |  Architecture & Delivery Roadmap
References and inspiration
Confidential - Internal use
68
