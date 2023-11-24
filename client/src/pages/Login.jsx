import { useContext, useState } from "react";
import {
    Card,
    Input,
    Button,
    Typography,
} from "@material-tailwind/react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { toast, Toaster } from 'react-hot-toast';
import AuthContext from "../components/AuthContext";

export default function Login() {

    const { updateUserRole } = useContext(AuthContext);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const navigate = useNavigate();


    const handleLogin = async (e) => {
        e.preventDefault();

        try {
            const res = await axios.post("http://localhost:4000/api/login",{
               email,
               password
            })

            const { message, token ,user} = res.data;
            
            toast.success(message);

            localStorage.setItem('token', token);
            localStorage.setItem('role',user.role)
            updateUserRole(user.role);
            setTimeout(() => {
               user.role === "Admin" ? navigate('/Admin') : navigate('/')
            }, 1200)

        } catch (error) {
            toast.error(error.response.statusText);
            console.error('Login failed:', error);
        }
    };



    return (
        <>
            <Toaster position="top-center"></Toaster>
            <Card color="transparent" className="h-screen flex justify-center items-center" shadow={false}>
            <img src="/Login/bg.webp" alt="bg" className="absolute h-screen w-screen -z-10 opacity-10" />
                <div className="bg-white p-10 rounded-xl border-4 border-red-200">
                    <Typography variant="h4" color="#800000" className="px-4 text-center">
                        LOGIN
                    </Typography>
                    <form className="mt-8 mb-2 w-80 max-w-screen-lg sm:w-96 mx-auto">
                        <div className="mb-4 flex flex-col gap-6  items-center justify-center">
                            <Input type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                size="lg" color="#800000" label={
                                    <>
                                        Email <span className="text-red-500">*</span>
                                    </>
                                } />
                            <Input
                                size="lg"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                color="#800000"
                                label={
                                    <>
                                        Password <span className="text-red-500">*</span>
                                    </>
                                }
                            />
                        </div>
                        <Typography color="gray" className="mt-2 mx-auto font-normal">
                            <Link to="http://localhost:4000/api/forgot-password" className=" underline font-medium transition-colors hover:text-orange-700">
                                Forgot your password?
                            </Link>
                        </Typography>
                        <Button className="mt-6 bg-[#800000]" type="submit" onClick={handleLogin} fullWidth>
                            SIGN IN
                        </Button>
                    </form>
                </div>

                <Typography color="gray" className="mt-4 mx-auto font-normal">
                    <Link to="/signup" className="underline font-medium text-red-500 transition-colors hover:text-red-800">
                        New customer? Create your account
                    </Link>
                </Typography>

            </Card>
        </>
    );
}
