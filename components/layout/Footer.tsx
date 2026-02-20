export default function Footer() {
    return (
        <footer className="border-t border-neutral-warm/20 bg-white py-8">
            <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-center md:text-left">
                    <p className="text-sm text-text-dark/60">
                        &copy; {new Date().getFullYear()} OSN Kebumian — Portal Resmi Pembinaan
                    </p>
                    <div className="flex justify-center md:justify-end gap-6 text-sm">
                        <a href="#" className="hover:text-accent-earthy transition-colors">Kontak</a>
                        <a href="#" className="hover:text-accent-earthy transition-colors">Kebijakan Privasi</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
