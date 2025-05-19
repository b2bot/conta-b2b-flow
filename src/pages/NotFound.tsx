
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: Página não encontrada:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="text-center space-y-4 max-w-md">
        <div className="flex justify-center items-center space-x-2 mb-6">
          <h1 className="text-2xl font-bold text-purple">Conta</h1>
          <div className="bg-purple text-white text-xs px-2 py-0.5 rounded-md">
            Partner B2B
          </div>
        </div>

        <h2 className="text-5xl font-bold text-purple-dark">404</h2>
        <p className="text-xl text-gray-600 mb-6">Oops! Página não encontrada</p>
        
        <p className="text-gray-500 mb-8">
          A página que você está procurando não existe ou foi movida.
        </p>
        
        <Link to="/dashboard">
          <Button className="bg-purple hover:bg-purple/90">
            Voltar para a página inicial
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
