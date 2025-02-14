import { Link } from "wouter";

interface SectionHeaderProps {
  title: string;
  buttonText?: string;
  linkHref?: string;
  currentCity?: { city: string; state: string };
}

export const SectionHeader = ({
  title,
  buttonText,
  linkHref,
  currentCity,
}: SectionHeaderProps) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-2xl font-bold font-slackey">{title}</h2>
      {buttonText && linkHref && (
        <Link href={`${linkHref}${currentCity ? `?city=${currentCity.city}&state=${currentCity.state}` : ''}`}>
          <button className="bg-blue-600 hover:bg-blue-700 text-xs text-white font-bold py-2 px-4 rounded">
            {buttonText}
          </button>
        </Link>
      )}
    </div>
  );
};

export default SectionHeader;