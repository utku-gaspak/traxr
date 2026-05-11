import { useState, type FormEvent } from "react";
import { register } from "../api/accountApi";
import { useNavigate, Link } from "react-router-dom";

const RegisterPage = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      await register({
        username,
        email,
        password,
      });

      alert("Kayıt başarılı! Şimdi giriş yapabilirsiniz.");
      navigate("/login");
    } catch (error) {
      console.error("Kayıt Hatası:", error);
      alert("Kayıt sırasında bir hata oluştu. Bilgileri kontrol edin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "100px auto", textAlign: "center", fontFamily: "sans-serif" }}>
      <h2>Yeni Hesap Oluştur</h2>
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
        <div style={{ marginBottom: "10px" }}>
          <input
            type="email"
            placeholder="E-posta"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
            backgroundColor: loading ? "#ccc" : "#28a745",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: "bold"
          }}
        >
          {loading ? "Kaydediliyor..." : "Kayıt Ol"}
        </button>
      </form>
      <p style={{ marginTop: "15px", fontSize: "14px" }}>
        Zaten hesabın var mı? <Link to="/login" style={{ color: "#007bff", textDecoration: "none" }}>Giriş Yap</Link>
      </p>
    </div>
  );
};

export default RegisterPage;
