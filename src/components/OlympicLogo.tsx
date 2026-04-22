type OlympicLogoProps = {
  className?: string;
  decorative?: boolean;
};

const OlympicLogo = ({ className = "", decorative = false }: OlympicLogoProps) => (
  <img
    className={`olympic-logo ${className}`.trim()}
    src="/images/logo-jo.png"
    alt={decorative ? "" : "Logo des Jeux olympiques"}
    aria-hidden={decorative || undefined}
  />
);

export default OlympicLogo;
