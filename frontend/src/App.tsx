import Chat from "./Chat"
import { Routes, Route } from "react-router-dom"
import Login from "./Login";
import Signup from "./Signup";
import New from "./New";


function App() {
  return (
    <>
      <Routes>
        <Route path='/' element={<Chat />} />
        <Route path='/login' element={<Login />} />
        <Route path='/signup' element={<Signup />} />
        <Route path="/dashboard" element={<New/>} />
      </Routes>
    </>
  )
}

export default App
