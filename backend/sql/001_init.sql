CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE IF NOT EXISTS schools (
 id TEXT PRIMARY KEY, name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, email TEXT, phone TEXT, address TEXT,
 plan TEXT NOT NULL DEFAULT 'DEMO', status TEXT NOT NULL DEFAULT 'ACTIVE', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS users (
 id TEXT PRIMARY KEY, school_id TEXT REFERENCES schools(id) ON DELETE RESTRICT, full_name TEXT NOT NULL,
 email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('SAAS_ADMIN','DIRECTOR','TEACHER','ACCOUNTANT','PARENT','STUDENT')),
 phone TEXT, is_active BOOLEAN NOT NULL DEFAULT TRUE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_school_role ON users(school_id, role);
CREATE TABLE IF NOT EXISTS classes (
 id TEXT PRIMARY KEY, school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE RESTRICT, name TEXT NOT NULL, level TEXT NOT NULL,
 section TEXT, capacity INT NOT NULL DEFAULT 30 CHECK(capacity > 0), academic_year TEXT NOT NULL, teacher_id TEXT,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE(school_id,name,academic_year)
);
CREATE TABLE IF NOT EXISTS teachers (
 id TEXT PRIMARY KEY, school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE RESTRICT, user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE RESTRICT,
 specialty TEXT, hire_date DATE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='classes_teacher_fk') THEN ALTER TABLE classes ADD CONSTRAINT classes_teacher_fk FOREIGN KEY(teacher_id) REFERENCES teachers(id) ON DELETE SET NULL; END IF; END $$;
CREATE TABLE IF NOT EXISTS parents (id TEXT PRIMARY KEY, school_id TEXT NOT NULL REFERENCES schools(id), user_id TEXT NOT NULL UNIQUE REFERENCES users(id), created_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS students (
 id TEXT PRIMARY KEY, school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE RESTRICT, user_id TEXT UNIQUE REFERENCES users(id), parent_id TEXT REFERENCES parents(id),
 first_name TEXT NOT NULL, last_name TEXT NOT NULL, birth_date DATE, gender TEXT, address TEXT, medical_notes TEXT,
 admission_year TEXT NOT NULL, class_id TEXT REFERENCES classes(id) ON DELETE SET NULL, status TEXT NOT NULL DEFAULT 'ACTIVE', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_students_school_class ON students(school_id,class_id);
CREATE TABLE IF NOT EXISTS subjects (id TEXT PRIMARY KEY, school_id TEXT NOT NULL REFERENCES schools(id), name TEXT NOT NULL, coefficient NUMERIC(6,2) NOT NULL DEFAULT 1, level TEXT, academic_year TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS rooms (id TEXT PRIMARY KEY, school_id TEXT NOT NULL REFERENCES schools(id), name TEXT NOT NULL, capacity INT NOT NULL DEFAULT 30, is_available BOOLEAN NOT NULL DEFAULT TRUE, created_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS timetable (id TEXT PRIMARY KEY, school_id TEXT NOT NULL REFERENCES schools(id), class_id TEXT NOT NULL REFERENCES classes(id), teacher_id TEXT REFERENCES teachers(id), room_id TEXT REFERENCES rooms(id), subject_name TEXT NOT NULL, day_of_week INT NOT NULL CHECK(day_of_week BETWEEN 0 AND 6), start_time TIME NOT NULL, end_time TIME NOT NULL, academic_year TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW(), CHECK(end_time > start_time));
CREATE TABLE IF NOT EXISTS grades (id TEXT PRIMARY KEY, school_id TEXT NOT NULL REFERENCES schools(id), student_id TEXT NOT NULL REFERENCES students(id), subject_id TEXT NOT NULL REFERENCES subjects(id), assessment TEXT NOT NULL, score NUMERIC(7,2) NOT NULL, max_score NUMERIC(7,2) NOT NULL DEFAULT 20, term TEXT NOT NULL, academic_year TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW(), CHECK(score >= 0 AND max_score > 0 AND score <= max_score));
CREATE TABLE IF NOT EXISTS attendance (id TEXT PRIMARY KEY, school_id TEXT NOT NULL REFERENCES schools(id), student_id TEXT NOT NULL REFERENCES students(id), date DATE NOT NULL, status TEXT NOT NULL CHECK(status IN ('PRESENT','ABSENT','LATE','EXCUSED')), justification TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), UNIQUE(student_id,date));
CREATE TABLE IF NOT EXISTS fee_schedules (id TEXT PRIMARY KEY, school_id TEXT NOT NULL REFERENCES schools(id), label TEXT NOT NULL, amount NUMERIC(12,3) NOT NULL, academic_year TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS payments (id TEXT PRIMARY KEY, school_id TEXT NOT NULL REFERENCES schools(id), student_id TEXT NOT NULL REFERENCES students(id), amount NUMERIC(12,3) NOT NULL CHECK(amount > 0), method TEXT NOT NULL CHECK(method IN ('CASH','BANK_TRANSFER','MOBILE_MONEY','CARD')), status TEXT NOT NULL DEFAULT 'PAID', reference TEXT, paid_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), academic_year TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS homework (id TEXT PRIMARY KEY, school_id TEXT NOT NULL REFERENCES schools(id), title TEXT NOT NULL, description TEXT NOT NULL, class_id TEXT NOT NULL REFERENCES classes(id), subject_id TEXT NOT NULL REFERENCES subjects(id), due_date TIMESTAMPTZ NOT NULL, attachment_url TEXT, correction_url TEXT, created_by TEXT REFERENCES users(id), created_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS submissions (id TEXT PRIMARY KEY, school_id TEXT NOT NULL REFERENCES schools(id), homework_id TEXT NOT NULL REFERENCES homework(id), student_id TEXT NOT NULL REFERENCES students(id), file_url TEXT, status TEXT NOT NULL DEFAULT 'SUBMITTED', score NUMERIC(7,2), comment TEXT, submitted_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS messages (id TEXT PRIMARY KEY, school_id TEXT NOT NULL REFERENCES schools(id), sender_id TEXT NOT NULL REFERENCES users(id), recipient_id TEXT NOT NULL REFERENCES users(id), subject TEXT NOT NULL, body TEXT NOT NULL, sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), read_at TIMESTAMPTZ);
CREATE TABLE IF NOT EXISTS announcements (id TEXT PRIMARY KEY, school_id TEXT NOT NULL REFERENCES schools(id), title TEXT NOT NULL, body TEXT NOT NULL, audience TEXT NOT NULL DEFAULT 'ALL', published_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE TABLE IF NOT EXISTS notifications (id TEXT PRIMARY KEY, school_id TEXT REFERENCES schools(id), user_id TEXT NOT NULL REFERENCES users(id), title TEXT NOT NULL, body TEXT NOT NULL, read_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS audit_logs (id TEXT PRIMARY KEY, school_id TEXT REFERENCES schools(id), actor_id TEXT REFERENCES users(id), action TEXT NOT NULL, entity TEXT NOT NULL, entity_id TEXT, details JSONB, created_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS admissions (id TEXT PRIMARY KEY, school_id TEXT NOT NULL REFERENCES schools(id), child_first_name TEXT NOT NULL, child_last_name TEXT NOT NULL, birth_date DATE, parent_name TEXT NOT NULL, parent_email TEXT NOT NULL, phone TEXT, requested_level TEXT, status TEXT NOT NULL DEFAULT 'PENDING', created_at TIMESTAMPTZ DEFAULT NOW());
-- Composite keys and foreign keys enforce tenant isolation at database level.
CREATE UNIQUE INDEX IF NOT EXISTS uq_users_id_school ON users(id,school_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_teachers_id_school ON teachers(id,school_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_parents_id_school ON parents(id,school_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_classes_id_school ON classes(id,school_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_subjects_id_school ON subjects(id,school_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_rooms_id_school ON rooms(id,school_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_students_id_school ON students(id,school_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_homework_id_school ON homework(id,school_id);
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='teacher_user_tenant_fk') THEN ALTER TABLE teachers ADD CONSTRAINT teacher_user_tenant_fk FOREIGN KEY(user_id,school_id) REFERENCES users(id,school_id); END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='parent_user_tenant_fk') THEN ALTER TABLE parents ADD CONSTRAINT parent_user_tenant_fk FOREIGN KEY(user_id,school_id) REFERENCES users(id,school_id); END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='class_teacher_tenant_fk') THEN ALTER TABLE classes ADD CONSTRAINT class_teacher_tenant_fk FOREIGN KEY(teacher_id,school_id) REFERENCES teachers(id,school_id); END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='student_class_tenant_fk') THEN ALTER TABLE students ADD CONSTRAINT student_class_tenant_fk FOREIGN KEY(class_id,school_id) REFERENCES classes(id,school_id); END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='student_parent_tenant_fk') THEN ALTER TABLE students ADD CONSTRAINT student_parent_tenant_fk FOREIGN KEY(parent_id,school_id) REFERENCES parents(id,school_id); END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='timetable_class_tenant_fk') THEN ALTER TABLE timetable ADD CONSTRAINT timetable_class_tenant_fk FOREIGN KEY(class_id,school_id) REFERENCES classes(id,school_id); END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='timetable_teacher_tenant_fk') THEN ALTER TABLE timetable ADD CONSTRAINT timetable_teacher_tenant_fk FOREIGN KEY(teacher_id,school_id) REFERENCES teachers(id,school_id); END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='timetable_room_tenant_fk') THEN ALTER TABLE timetable ADD CONSTRAINT timetable_room_tenant_fk FOREIGN KEY(room_id,school_id) REFERENCES rooms(id,school_id); END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='grade_student_tenant_fk') THEN ALTER TABLE grades ADD CONSTRAINT grade_student_tenant_fk FOREIGN KEY(student_id,school_id) REFERENCES students(id,school_id); END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='grade_subject_tenant_fk') THEN ALTER TABLE grades ADD CONSTRAINT grade_subject_tenant_fk FOREIGN KEY(subject_id,school_id) REFERENCES subjects(id,school_id); END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='payment_student_tenant_fk') THEN ALTER TABLE payments ADD CONSTRAINT payment_student_tenant_fk FOREIGN KEY(student_id,school_id) REFERENCES students(id,school_id); END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='homework_class_tenant_fk') THEN ALTER TABLE homework ADD CONSTRAINT homework_class_tenant_fk FOREIGN KEY(class_id,school_id) REFERENCES classes(id,school_id); END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='homework_subject_tenant_fk') THEN ALTER TABLE homework ADD CONSTRAINT homework_subject_tenant_fk FOREIGN KEY(subject_id,school_id) REFERENCES subjects(id,school_id); END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='message_sender_tenant_fk') THEN ALTER TABLE messages ADD CONSTRAINT message_sender_tenant_fk FOREIGN KEY(sender_id,school_id) REFERENCES users(id,school_id); END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='message_recipient_tenant_fk') THEN ALTER TABLE messages ADD CONSTRAINT message_recipient_tenant_fk FOREIGN KEY(recipient_id,school_id) REFERENCES users(id,school_id); END IF;
END $$;
