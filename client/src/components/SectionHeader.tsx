import { Link } from "wouter";

interface SectionHeaderProps {
  title: string;
  buttonText: string;
  linkHref: string;
}

export const SectionHeader = ({ title, buttonText, linkHref }: SectionHeaderProps) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-2xl font-bold font-slackey">{title}</h2>
      <Link href={linkHref}>
        <button className="bg-blue-600 hover:bg-blue-700 text-xs text-white font-bold py-2 px-4 rounded">
          {buttonText}
        </button>
      </Link>
    </div>
  );
};

export default SectionHeader;
