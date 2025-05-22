import { useLocation,useNavigate,  } from "react-router-dom";
import useAuth from "../hooks/useAuth";

const RequireAuthButton = ({ children }) => {
  const { auth } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleClick = (e) => {
    if (!auth?.user) {
      e.preventDefault();
      navigate('/login', {state: {from: {pathname: location} } } );
      return;
    }
  }

  return (
    <div onClick={handleClick}>
      {children}
    </div>
  )
}

export default RequireAuthButton;
