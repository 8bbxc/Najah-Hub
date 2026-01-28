import RobotLogin from '../components/RobotLogin';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate();
  return <RobotLogin onSuccess={() => navigate('/home')} />;
};

export default Login;