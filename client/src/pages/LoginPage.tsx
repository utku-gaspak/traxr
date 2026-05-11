import axios from "axios";
import { useState, type FormEvent } from "react";
import { login as loginRequest } from "../api/accountApi";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const { login: storeToken } = useAuth();
  const navigate = useNavigate();

  const showLoginFailure = () => {
    alert("Login failed.")
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const authData = await loginRequest({
        username,
        password,
      });

      if (authData && authData.token) {
        storeToken(authData.token);
        navigate("/");
      } else {
        showLoginFailure();
      }
    } catch (error) {
      console.error("Giriş Hatası:", error);

      if (axios.isAxiosError(error) && error.response?.status === 401) {
        alert("Kullanıcı adı veya şifre hatalı!");
      } else {
        showLoginFailure();
      }
    } finally {
      setLoading(false);
    }
  };
  return (
    <div style={{ maxWidth: "400px", margin: "100px auto", textAlign: "center", fontFamily: "sans-serif" }}>
      <h2>Job Tracker Login</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "10px" }}>
          <input
            type="text"
            placeholder="Kullanıcı Adı"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            style={{ width: "100%", padding: "10px", borderRadius: "4px", border: "1px solid #ccc" }}
          />
        </div>
        <div style={{ marginBottom: "15px" }}>
          <input
            type="password"
            placeholder="Şifre"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: "100%", padding: "10px", borderRadius: "4px", border: "1px solid #ccc" }}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px",
            backgroundColor: loading ? "#ccc" : "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          {loading ? "Bağlanıyor..." : "Giriş Yap"}
        </button>
        <p style={{ marginTop: "15px", fontSize: "14px" }}>
          Henüz hesabın yok mu? <Link to="/register" style={{ color: "#007bff", textDecoration: "none" }}>Hemen Kayıt Ol</Link>
        </p>
      </form>
    </div>
  );
};

export default LoginPage;
