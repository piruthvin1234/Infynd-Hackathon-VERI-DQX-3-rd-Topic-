export default function Logo({ size = "medium" }) {
    const sizes = {
        small: "h-12",
        medium: "h-20",
        large: "h-28",
    };

    return (
        <div className="flex justify-center items-center">
            <img
                src="/logo.jpg"
                alt="VETRI DQX - Your Best AI Data Quality Xpert Copilot"
                className={`${sizes[size]} object-contain`}
            />
        </div>
    );
}
