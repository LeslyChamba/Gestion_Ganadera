import { Link, Outlet, Route, Routes } from 'react-router-dom';
import { Aviso } from './components/Aviso';
import { Cabecera } from './components/Cabecera';
import { AnimalFormPage } from './pages/AnimalFormPage';
import { BuscarPage } from './pages/BuscarPage';
import { FichaPage } from './pages/FichaPage';

function Estructura() {
  return (
    <>
      <a href="#contenido" className="saltar">
        Saltar al contenido
      </a>
      <Cabecera />
      <main id="contenido" className="contenido">
        <Outlet />
      </main>
    </>
  );
}

function NoEncontrada() {
  return (
    <Aviso tipo="info" titulo="Esta página no existe">
      <Link to="/">Ir al buscador</Link>
    </Aviso>
  );
}

export function App() {
  return (
    <Routes>
      <Route element={<Estructura />}>
        <Route index element={<BuscarPage />} />
        <Route path="animales/nuevo" element={<AnimalFormPage modo="crear" />} />
        <Route path="animales/:id" element={<FichaPage />} />
        <Route path="animales/:id/editar" element={<AnimalFormPage modo="editar" />} />
        <Route path="*" element={<NoEncontrada />} />
      </Route>
    </Routes>
  );
}
