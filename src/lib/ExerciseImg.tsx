import { useState } from 'react';
import { Dumbbell } from 'lucide-react';
import { getEjercicioImageUrl } from './imageUtils';

type ExerciseImgProps = {
  url: string | null | undefined;
  alt?: string;
  className?: string;
  containerClassName?: string;
  fallbackSize?: number;
};

export function ExerciseImg({ url, alt = '', className, containerClassName, fallbackSize = 40 }: ExerciseImgProps) {
  const [failed, setFailed] = useState(false);
  const src = getEjercicioImageUrl(url);

  if (!src || failed) {
    return (
      <div className={containerClassName ?? 'w-full h-full bg-slate-900 flex items-center justify-center'}>
        <Dumbbell size={fallbackSize} className="text-gray-600" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
