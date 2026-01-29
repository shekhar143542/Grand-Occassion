import { useState } from "react";
import { Menu, X, User, LogOut, LayoutDashboard, Crown } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navbar = () => {
    const { user, isAdmin, signOut } = useAuth();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);

    const handleSignOut = async () => {
        await signOut();
        navigate('/');
    };

    const handleGetStarted = () => {
        if (user) {
            navigate('/dashboard');
        } else {
            navigate('/login');
        }
    };

    const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
        e.preventDefault();
        const element = document.getElementById(targetId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        setIsOpen(false);
    };

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
            <div className="container mx-auto px-6 py-4">
                <div className="flex items-center justify-between">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-3">
                        <div className="w-10 h-10 border border-primary flex items-center justify-center">
                            <span className="font-display text-primary text-xl font-bold">R</span>
                        </div>
                        <div className="hidden sm:block">
                            <h1 className="font-display text-xl tracking-wide text-foreground">
                                Grand <span className="text-primary">Occasion</span>
                            </h1>
                            <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
                                Premium Banquet Halls
                            </p>
                        </div>
                    </Link>

                    {/* Desktop Navigation - Centered */}
                    <div className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
                        <Link
                            to="/"
                            className="font-body text-base tracking-wide text-foreground hover:text-primary transition-colors duration-300"
                        >
                            Home
                        </Link>
                        <a
                            href="#how-it-works"
                            onClick={(e) => handleSmoothScroll(e, 'how-it-works')}
                            className="font-body text-base tracking-wide text-foreground hover:text-primary transition-colors duration-300"
                        >
                            How It Works
                        </a>
                        <Link
                            to="/admin/login"
                            className="font-body text-base tracking-wide text-foreground hover:text-primary transition-colors duration-300"
                        >
                            Admin
                        </Link>
                    </div>

                    {/* Auth Actions - Desktop */}
                    <div className="hidden md:flex items-center gap-4">
                        <button
                            onClick={handleGetStarted}
                            className="btn-luxury-filled rounded-full"
                        >
                            <span>Get Started</span>
                        </button>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="md:hidden text-foreground hover:text-primary transition-colors"
                    >
                        {isOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>

                {/* Mobile Menu */}
                {isOpen && (
                    <div className="md:hidden mt-4 pb-4 border-t border-border pt-4 animate-fade-in">
                        <div className="flex flex-col gap-4">
                            <Link
                                to="/"
                                onClick={() => setIsOpen(false)}
                                className="font-body text-base tracking-wide text-foreground hover:text-primary transition-colors duration-300"
                            >
                                Home
                            </Link>
                            <a
                                href="#how-it-works"
                                onClick={(e) => handleSmoothScroll(e, 'how-it-works')}
                                className="font-body text-base tracking-wide text-foreground hover:text-primary transition-colors duration-300"
                            >
                                How It Works
                            </a>
                            <Link
                                to="/admin/login"
                                onClick={() => setIsOpen(false)}
                                className="font-body text-base tracking-wide text-foreground hover:text-primary transition-colors duration-300"
                            >
                                Admin
                            </Link>

                            <div className="flex flex-col gap-2 mt-2">
                                <button
                                    onClick={() => {
                                        handleGetStarted();
                                        setIsOpen(false);
                                    }}
                                    className="btn-luxury-filled rounded-full text-center"
                                >
                                    <span>Get Started</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
