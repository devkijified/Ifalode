-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Brand settings table (CMS)
CREATE TABLE brand_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_name TEXT DEFAULT 'IfaLode',
  display_name TEXT,
  primary_color TEXT DEFAULT '#8B5E3C',
  secondary_color TEXT DEFAULT '#D4A574',
  accent_color TEXT DEFAULT '#C41E3A',
  font_family TEXT DEFAULT 'Inter',
  logo_url TEXT,
  favicon_url TEXT,
  meta_title TEXT,
  meta_description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Store products table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  cover_image TEXT,
  file_url TEXT,
  category TEXT,
  is_ebook BOOLEAN DEFAULT TRUE,
  stock INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Courses table (LMS)
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  instructor TEXT,
  price DECIMAL(10,2),
  cover_image TEXT,
  category TEXT,
  level TEXT CHECK (level IN ('beginner', 'intermediate', 'advanced')),
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Course lessons
CREATE TABLE lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  video_url TEXT,
  order_number INTEGER,
  duration INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User enrollments
CREATE TABLE enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

-- Orders table
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  course_id UUID REFERENCES courses(id),
  amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  payment_method TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admin can view all profiles" ON profiles FOR ALL USING (auth.role() = 'admin');

-- Brand settings policies
CREATE POLICY "Anyone can view brand settings" ON brand_settings FOR SELECT USING (true);
CREATE POLICY "Only admin can modify brand settings" ON brand_settings FOR ALL USING (auth.role() = 'admin');

-- Products policies
CREATE POLICY "Anyone can view products" ON products FOR SELECT USING (true);
CREATE POLICY "Admin can manage products" ON products FOR ALL USING (auth.role() = 'admin');

-- Courses policies
CREATE POLICY "Anyone can view published courses" ON courses FOR SELECT USING (is_published = true);
CREATE POLICY "Admin can manage courses" ON courses FOR ALL USING (auth.role() = 'admin');

-- Lessons policies
CREATE POLICY "Enrolled users can view lessons" ON lessons FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM enrollments 
    WHERE enrollments.course_id = lessons.course_id 
    AND enrollments.user_id = auth.uid()
  )
);
CREATE POLICY "Admin can manage lessons" ON lessons FOR ALL USING (auth.role() = 'admin');

-- Enrollments policies
CREATE POLICY "Users can view own enrollments" ON enrollments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admin can view all enrollments" ON enrollments FOR ALL USING (auth.role() = 'admin');

-- Orders policies
CREATE POLICY "Users can view own orders" ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admin can view all orders" ON orders FOR ALL USING (auth.role() = 'admin');

-- Insert default brand settings
INSERT INTO brand_settings (brand_name, display_name, primary_color, secondary_color, accent_color) 
VALUES ('IfaLode', 'IfaLode', '#8B5E3C', '#D4A574', '#C41E3A');

-- Insert sample data
INSERT INTO products (title, description, price, category) VALUES
  ('The Wisdom of Ifá', 'Ancient teachings and divination practices', 29.99, 'Spirituality'),
  ('Odu Ifá: The Sacred Verses', 'Complete collection of Odu Ifá verses', 49.99, 'Sacred Texts');

INSERT INTO courses (title, description, instructor, price, level, is_published) VALUES
  ('Introduction to Ifá Divination', 'Learn the basics of Ifá divination and interpretation', 'Baba Ifáyemi', 99.99, 'beginner', true),
  ('Advanced Ifá Practices', 'Deepen your understanding of Ifá rituals and ceremonies', 'Baba Ifáyemi', 149.99, 'intermediate', true);
