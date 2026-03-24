import Chat from "./Chat"
import { Routes, Route } from "react-router-dom"
import Login from "./Login";
import Signup from "./Signup";
import New from "./New";
import Title from "./Title";
import Check from "./Check";
import Registration from "./Registration";
import Companysetup from "./Companysetup";
import AdminDashboard from "./AdminDashboard";

function App() {
  return (
    <>
      <Routes>
        <Route path='/' element={<Chat />} />
        <Route path='/login' element={<Login />} />
        <Route path='/signup' element={<Signup />} />
        <Route path="/dashboard" element={<New/>} />
        <Route path="/title" element={<Title/>} />
        <Route path="/check" element={<Check/>} />
        <Route path="/regis" element={<Registration/>} />
        <Route path="/setup" element={<Companysetup/>} />
        <Route path="/dash" element={<AdminDashboard/>} />
      </Routes>
    </>
  )
}

export default App
