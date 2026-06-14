/*
  # Create Ejercicios Table

  Creates the exercises library table for FPTrainingPro with 33 pre-loaded exercises across 9 muscle groups.

  ## New Table
  
  ### ejercicios
  - `id` - UUID primary key
  - `nombre` - Exercise name
  - `grupo_muscular` - Muscle group (Pecho, Espalda, Piernas, Hombros, Bíceps, Tríceps, Abdomen, Glúteos, Cardio)
  - `descripcion` - Detailed exercise description
  - `musculos_secundarios` - Secondary muscles worked
  - `consejos` - Tips and common mistakes
  - `imagen_url` - Public URL to exercise image from Pexels/Unsplash
  - `created_at` - Timestamp

  ## Security
  - RLS enabled: students can view all exercises, admin can manage
*/

CREATE TABLE IF NOT EXISTS ejercicios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  grupo_muscular text NOT NULL,
  descripcion text NOT NULL,
  musculos_secundarios text,
  consejos text,
  imagen_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ejercicios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view exercises"
  ON ejercicios FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can insert exercises"
  ON ejercicios FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM perfiles p
      WHERE p.id = auth.uid()
      AND p.rol = 'administrador'
    )
  );

CREATE POLICY "Admin can update exercises"
  ON ejercicios FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM perfiles p
      WHERE p.id = auth.uid()
      AND p.rol = 'administrador'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM perfiles p
      WHERE p.id = auth.uid()
      AND p.rol = 'administrador'
    )
  );

CREATE POLICY "Admin can delete exercises"
  ON ejercicios FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM perfiles p
      WHERE p.id = auth.uid()
      AND p.rol = 'administrador'
    )
  );

-- Pre-load 33 exercises
INSERT INTO ejercicios (nombre, grupo_muscular, descripcion, musculos_secundarios, consejos, imagen_url) VALUES

-- PECHO (5)
('Press de banca con barra', 'Pecho', 'Acuéstate en un banco horizontal. Coloca la barra a la altura del pecho. Empuja la barra hacia arriba hasta extender completamente los brazos. Baja controladamente.', 'Tríceps, Hombros', 'Mantén los pies apoyados. No bounces la barra. Controla el movimiento en ambas fases.', 'https://images.pexels.com/photos/3807517/pexels-photo-3807517.jpeg'),
('Press inclinado con mancuernas', 'Pecho', 'Recuesta el banco a 45 grados. Con una mancuerna en cada mano a la altura del pecho. Empuja hacia arriba y adelante hasta extender los brazos.', 'Pecho superior, Hombros', 'Mantén el control de las mancuernas. No dejes caer. Muévete de forma controlada.', 'https://images.pexels.com/photos/3807517/pexels-photo-3807517.jpeg'),
('Aperturas con mancuernas', 'Pecho', 'Acuéstate en un banco. Con una mancuerna en cada mano, brazos extendidos. Abre los brazos en un movimiento de arco controlado, bajando las mancuernas.', 'Hombros', 'Mantén un pequeño ángulo en los codos. Controla el movimiento. Siente el estiramiento del pecho.', 'https://images.pexels.com/photos/3807517/pexels-photo-3807517.jpeg'),
('Fondos en paralelas', 'Pecho', 'Suspéndete entre dos barras paralelas. Baja el cuerpo doblando los codos. Empuja hacia arriba hasta extender los brazos. Inclina el torso hacia adelante.', 'Pecho inferior, Tríceps', 'Controla la velocidad. No hagas rebotes. Mantén el core contraído.', 'https://images.pexels.com/photos/3807517/pexels-photo-3807517.jpeg'),
('Press en máquina', 'Pecho', 'Siéntate en la máquina de press de pecho. Agarra las asas. Empuja hacia adelante hasta extender completamente los brazos. Vuelve controladamente.', 'Tríceps', 'Ajusta la máquina a tu altura. Evita bloquear los codos. Movimiento fluido.', 'https://images.pexels.com/photos/3807517/pexels-photo-3807517.jpeg'),

-- ESPALDA (5)
('Dominadas', 'Espalda', 'Cuelgate de una barra con las manos separadas al ancho de los hombros. Tira del cuerpo hacia arriba hasta que la barbilla pase la barra. Baja controladamente.', 'Bíceps', 'Si es difícil, usa banda elástica de asistencia. Evita impulsar con las piernas. Movimiento completo.', 'https://images.pexels.com/photos/3807517/pexels-photo-3807517.jpeg'),
('Remo con barra', 'Espalda', 'De pie con las piernas ligeramente flexionadas. Baja el torso inclinándote. Con la barra en las manos, tira hacia tu abdomen. Vuelve a la posición inicial.', 'Bíceps', 'Mantén la espalda recta. No hagas impulsos. Contrae el dorsales.', 'https://images.pexels.com/photos/3807517/pexels-photo-3807517.jpeg'),
('Remo con mancuerna', 'Espalda', 'Apoya una rodilla en un banco, una mancuerna en el piso. Tira la mancuerna hacia tu cadera. Controla la bajada. Alterna lados.', 'Dorsal', 'Mantén la espalda recta. Evita rotaciones. Rango completo de movimiento.', 'https://images.pexels.com/photos/3807517/pexels-photo-3807517.jpeg'),
('Jalón al pecho', 'Espalda', 'Siéntate en la máquina. Agarra la barra ancha. Tira hacia tu pecho, llevando los codos hacia abajo. Vuelve controladamente.', 'Bíceps', 'No uses impulso. Mantén el torso recto. Contrae el dorsales completamente.', 'https://images.pexels.com/photos/3807517/pexels-photo-3807517.jpeg'),
('Peso muerto', 'Espalda', 'De pie, pies al ancho de hombros. Baja hacia la barra manteniendo la espalda recta. Levanta con las piernas y la espalda simultáneamente. Extiende completamente.', 'Glúteos, Piernas', 'Espalda recta en todo momento. Mantén la barra cerca del cuerpo. Respiración controlada.', 'https://images.pexels.com/photos/3807517/pexels-photo-3807517.jpeg'),

-- PIERNAS (5)
('Sentadilla con barra', 'Piernas', 'De pie con la barra en los hombros. Baja doblando las rodillas y caderas hasta que los muslos queden paralelos al piso. Vuelve a la posición inicial.', 'Glúteos', 'Rodillas alineadas con los pies. Pecho arriba. Movimiento controlado.', 'https://images.pexels.com/photos/3807517/pexels-photo-3807517.jpeg'),
('Prensa de piernas', 'Piernas', 'Siéntate en la máquina. Pies sobre la plataforma al ancho de hombros. Baja doblando las rodillas. Empuja con las piernas extendiendo completamente.', 'Glúteos', 'No bloquees las rodillas. Rango completo. Movimiento fluido.', 'https://images.pexels.com/photos/3807517/pexels-photo-3807517.jpeg'),
('Extensiones de cuádriceps', 'Piernas', 'Siéntate en la máquina. Coloca los pies bajo la barra. Extiende las piernas hacia adelante contra la resistencia. Baja controladamente.', 'Cuádriceps', 'Movimiento aislado. No uses impulso. Contrae completamente el cuádriceps.', 'https://images.pexels.com/photos/3807517/pexels-photo-3807517.jpeg'),
('Curl de piernas', 'Piernas', 'Acuéstate boca abajo en la máquina. Coloca los pies bajo la barra. Curva las rodillas trayendo los talones hacia los glúteos. Baja controladamente.', 'Isquiotibiales', 'Movimiento controlado. Contrae los isquiotibiales completamente. No dejes caer.', 'https://images.pexels.com/photos/3807517/pexels-photo-3807517.jpeg'),
('Peso muerto rumano', 'Piernas', 'De pie con mancuernas o barra. Pies al ancho de hombros. Baja inclinándote desde las caderas, manteniendo la espalda recta. Siente el estiramiento en los isquiotibiales.', 'Isquiotibiales, Glúteos', 'Espalda recta. Movimiento controlado. Flexibilidad importante.', 'https://images.pexels.com/photos/3807517/pexels-photo-3807517.jpeg'),

-- HOMBROS (4)
('Press militar con barra', 'Hombros', 'De pie con la barra a la altura de los hombros. Empuja hacia arriba hasta extender completamente. Baja controladamente a la posición inicial.', 'Deltoides', 'Mantén el core contraído. No arquees la espalda. Movimiento controlado.', 'https://images.pexels.com/photos/3807517/pexels-photo-3807517.jpeg'),
('Elevaciones laterales', 'Hombros', 'De pie con una mancuerna en cada mano. Levanta los brazos lateralmente hasta la altura de los hombros. Baja controladamente.', 'Deltoides lateral', 'Ligera flexión en los codos. Movimiento lento y controlado. Siente la quemadura.', 'https://images.pexels.com/photos/3807517/pexels-photo-3807517.jpeg'),
('Elevaciones frontales', 'Hombros', 'De pie con una mancuerna en cada mano. Levanta los brazos hacia adelante hasta la altura de los ojos. Baja controladamente. Alterna.', 'Deltoides frontal', 'Movimiento controlado. Sin impulso. Alcanza la altura de los ojos.', 'https://images.pexels.com/photos/3807517/pexels-photo-3807517.jpeg'),
('Pájaros (Reverse Flies)', 'Hombros', 'Inclínate hacia adelante. Con una mancuerna en cada mano. Levanta los brazos hacia los lados hasta la altura de los hombros. Baja controladamente.', 'Deltoides posterior', 'Movimiento lento y controlado. Evita impulsos. Contrae completamente.', 'https://images.pexels.com/photos/3807517/pexels-photo-3807517.jpeg'),

-- BÍCEPS (3)
('Curl con barra', 'Bíceps', 'De pie con la barra en las manos, brazos extendidos. Curva los codos trayendo la barra hacia los hombros. Baja controladamente sin bloquear.', 'Bíceps', 'Evita balanceo. Movimiento lento y controlado. Contrae en la cima.', 'https://images.pexels.com/photos/3807517/pexels-photo-3807517.jpeg'),
('Curl con mancuernas', 'Bíceps', 'De pie con una mancuerna en cada mano. Curva los codos trayendo las mancuernas hacia los hombros. Baja controladamente.', 'Bíceps', 'Mantén los codos en el lugar. Movimiento aislado. Sin impulso.', 'https://images.pexels.com/photos/3807517/pexels-photo-3807517.jpeg'),
('Curl martillo', 'Bíceps', 'De pie con las mancuernas a los lados, palmas mirando hacia adentro. Curva hacia los hombros. Baja controladamente.', 'Bíceps, Braquial', 'Agarre neutro. Movimiento controlado. Excelente para el braquial.', 'https://images.pexels.com/photos/3807517/pexels-photo-3807517.jpeg'),

-- TRÍCEPS (3)
('Extensión en polea', 'Tríceps', 'De pie frente a la polea. Agarra la barra. Extiende los brazos hacia abajo contra la resistencia. Vuelve controladamente.', 'Tríceps', 'Mantén los codos en el lugar. Movimiento aislado. Contrae completamente.', 'https://images.pexels.com/photos/3807517/pexels-photo-3807517.jpeg'),
('Press francés', 'Tríceps', 'Acuéstate boca arriba. Con una barra sobre la cabeza. Baja la barra hacia la frente/detrás de la cabeza doblando los codos. Extiende controladamente.', 'Tríceps', 'Mantén los codos fijos. Movimiento controlado. Excelente aislamiento.', 'https://images.pexels.com/photos/3807517/pexels-photo-3807517.jpeg'),
('Fondos en banco', 'Tríceps', 'Apoya las manos en un banco detrás. Piernas extendidas. Baja el cuerpo doblando los codos. Empuja hacia arriba.', 'Tríceps', 'Movimiento controlado. Espalda cerca del banco. Rango completo.', 'https://images.pexels.com/photos/3807517/pexels-photo-3807517.jpeg'),

-- ABDOMEN (3)
('Crunch abdominal', 'Abdomen', 'Acuéstate boca arriba con las rodillas flexionadas. Levanta el torso hacia las rodillas usando solo los abdominales. Baja controladamente.', 'Abdomen', 'Movimiento corto y controlado. No tires del cuello. Contrae los abdominales.', 'https://images.pexels.com/photos/3807517/pexels-photo-3807517.jpeg'),
('Plancha', 'Abdomen', 'Apoya los antebrazos y los dedos de los pies en el piso. Mantén el cuerpo recto. Contrae el core y aguanta la posición.', 'Core completo', 'Mantén la alineación. No dejes caer las caderas. Respiración controlada.', 'https://images.pexels.com/photos/3807517/pexels-photo-3807517.jpeg'),
('Elevación de piernas', 'Abdomen', 'Acuéstate boca arriba. Levanta las piernas extendidas hacia el pecho. Baja sin tocar el piso. Movimiento controlado.', 'Abdomen inferior', 'Movimiento lento. Mantén las piernas rectas. Usa solo los abdominales.', 'https://images.pexels.com/photos/3807517/pexels-photo-3807517.jpeg'),

-- GLÚTEOS (2)
('Hip thrust', 'Glúteos', 'Espalda apoyada en un banco, pies en el piso. Levanta las caderas hacia arriba contrayendo los glúteos. Baja controladamente.', 'Glúteos', 'Contrae completamente los glúteos en la cima. Movimiento controlado. Siente el trabajo.', 'https://images.pexels.com/photos/3807517/pexels-photo-3807517.jpeg'),
('Sentadilla sumo', 'Glúteos', 'De pie con los pies más abiertos que el ancho de hombros, puntas hacia afuera. Baja en sentadilla profunda. Vuelve a la posición inicial.', 'Glúteos, Aductores', 'Peso en los talones. Profundidad total. Tronco vertical.', 'https://images.pexels.com/photos/3807517/pexels-photo-3807517.jpeg'),

-- CARDIO (3)
('Caminata en cinta', 'Cardio', 'Corre o camina en la cinta a velocidad moderada. Mantén una frecuencia cardíaca aeróbica. Ideal para resistencia cardiovascular.', 'Cardio general', 'Mantén una velocidad sostenible. Hidratación. No inclines demasiado.', 'https://images.pexels.com/photos/3807517/pexels-photo-3807517.jpeg'),
('HIIT en bicicleta', 'Cardio', 'Alterna entre intervalos de máxima intensidad (30s) y recuperación (30s). Excelente para quemar grasa. Durabilidad: 20-30 minutos.', 'Cardio, Quema de grasa', 'Calentamiento previo. Mantén buena forma. Recuperación activa.', 'https://images.pexels.com/photos/3807517/pexels-photo-3807517.jpeg'),
('Salto de cuerda', 'Cardio', 'Salta la cuerda manteniendo un ritmo constante. Excelente coordinación y resistencia. Alternancia de pies o ambos juntos.', 'Cardio, Coordinación', 'Aumenta gradualmente la intensidad. Superficies suaves. Forma correcta.', 'https://images.pexels.com/photos/3807517/pexels-photo-3807517.jpeg')
ON CONFLICT DO NOTHING;
