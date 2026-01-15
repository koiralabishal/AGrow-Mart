import logo from "../../assets/Logo AgroMart.png";
import "../../styles/common/Footer.css";

const SupplierFooter = () => {
  const handleScrollTo = (event, id) => {
    event.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <footer id="contact" className="supplier-footer-section">
      <div className="footer-content">
        <div className="footer-left">
          <img src={logo} alt="AgroMart Logo" className="footer-logo" />
          <p className="footer-description">
            Empowering Nepali farmers through technology, AgroMart
            revolutionizes traditional markets into digital success stories.
            We&apos;re creating a future where farming meets innovation, and
            prosperity grows from every digital transaction.
          </p>
        </div>

        <div className="footer-center">
          <h3>Quick Links</h3>
          <ul>
            <li>
              <a href="#" onClick={(e) => handleScrollTo(e, "hero")}>
                Home
              </a>
            </li>
            <li>
              <a href="#" onClick={(e) => handleScrollTo(e, "agri-inputs")}>
                Agri Inputs
              </a>
            </li>
            <li>
              <a href="#" onClick={(e) => handleScrollTo(e, "experience")}>
                About
              </a>
            </li>
            <li>
              <a href="#" onClick={(e) => handleScrollTo(e, "contact")}>
                Contact
              </a>
            </li>
          </ul>
        </div>

        <div className="footer-right">
          <h3>Contacts</h3>
          <ul>
            <li>
              <span>Address:</span> Pokhara, Kaski, Nepal
            </li>
            <li>
              <span>Phone Numbers:</span> 9848260732
            </li>
            <li>
              <span>Email:</span> agromart@gmail.com
            </li>
          </ul>
        </div>
      </div>

      <div className="footer-copyright">
        <p>&copy; {new Date().getFullYear()} AgroMart. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default SupplierFooter;
