export default function Footer() {
    return (
        <footer className="border-t border-neutral-warm/20 bg-white py-6">
            <div className="container mx-auto px-4 text-center text-sm text-text-dark/60">
                <p>&copy; {new Date().getFullYear()} OSN Kebumian Platform. All rights reserved.</p>
                <div className="mt-2 flex justify-center gap-4">
                    <a href="#" className="hover:text-accent-earthy transition-colors">Privacy Policy</a>
                    <a href="#" className="hover:text-accent-earthy transition-colors">Terms of Service</a>
                    <a href="#" className="hover:text-accent-earthy transition-colors">Contact</a>
                </div>
            </div>
        </footer>
    );
}
