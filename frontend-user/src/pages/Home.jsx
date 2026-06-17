import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Droplets, CheckCircle, Leaf, Car, Calendar, MapPin, Phone, Mail, Award, Clock, Menu, X } from 'lucide-react';
import logo from '../assets/wash my car.png';

const Home = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div style={{fontFamily: 'Outfit, sans-serif', color: 'var(--text-dark)', background: '#F4F7FB'}}>
      
      {/* Navbar */}
      <nav style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 5%', background: 'linear-gradient(90deg, var(--primary-navy), var(--primary-blue))', color: 'white', position: 'relative'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
          <div style={{background: 'white', padding: '0.2rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '50px', height: '50px'}}>
            <img src={logo} alt="Wash My Car Logo" style={{width: '100%', height: '100%', objectFit: 'contain', transform: 'scale(1.2)'}} />
          </div>
          <span style={{fontWeight: 800, fontSize: 'clamp(1.2rem, 4vw, 1.5rem)', whiteSpace: 'nowrap', letterSpacing: '0.5px'}}>WASH MY CAR</span>
        </div>
        
        {/* Desktop Menu */}
        <div className="hidden md:flex" style={{gap: '2rem', fontWeight: 500, fontSize: '1rem'}}>
          <a href="#" style={{color: 'white'}}>Home</a>
          <a href="#services" style={{color: 'rgba(255,255,255,0.8)'}}>Services</a>
          <a href="/login" style={{color: 'rgba(255,255,255,0.8)'}}>Book Now</a>
          <a href="#about" style={{color: 'rgba(255,255,255,0.8)'}}>About</a>
          <a href="#contact" style={{color: 'rgba(255,255,255,0.8)'}}>Contact</a>
        </div>
        
        {/* Desktop Auth Buttons */}
        <div className="hidden md:flex" style={{gap: '0.5rem'}}>
          <button onClick={() => navigate('/login')} className="btn" style={{background: 'transparent', color: 'white', border: '1px solid rgba(255,255,255,0.5)', padding: '0.5rem 1rem'}}>Login</button>
          <button onClick={() => navigate('/register')} className="btn btn-teal" style={{padding: '0.5rem 1rem'}}>Register</button>
        </div>

        {/* Mobile Hamburger */}
        <div className="md:hidden" style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
          <button onClick={() => navigate('/login')} className="btn btn-teal" style={{padding: '0.4rem 0.8rem', fontSize: '0.9rem'}}>Book</button>
          <button onClick={() => setMenuOpen(!menuOpen)} style={{background: 'transparent', border: 'none', color: 'white', cursor: 'pointer'}}>
            {menuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {menuOpen && (
          <div style={{position: 'absolute', top: '100%', left: 0, width: '100%', background: 'var(--primary-navy)', padding: '1rem 5%', display: 'flex', flexDirection: 'column', gap: '1rem', zIndex: 50, borderTop: '1px solid rgba(255,255,255,0.1)'}}>
            <a href="#" onClick={() => setMenuOpen(false)} style={{color: 'white', fontSize: '1.1rem'}}>Home</a>
            <a href="#services" onClick={() => setMenuOpen(false)} style={{color: 'rgba(255,255,255,0.8)', fontSize: '1.1rem'}}>Services</a>
            <a href="#about" onClick={() => setMenuOpen(false)} style={{color: 'rgba(255,255,255,0.8)', fontSize: '1.1rem'}}>About</a>
            <a href="#contact" onClick={() => setMenuOpen(false)} style={{color: 'rgba(255,255,255,0.8)', fontSize: '1.1rem'}}>Contact</a>
            <div style={{display: 'flex', gap: '1rem', marginTop: '1rem'}}>
              <button onClick={() => navigate('/login')} className="btn" style={{flex: 1, background: 'transparent', color: 'white', border: '1px solid rgba(255,255,255,0.5)', padding: '0.5rem 1rem'}}>Login</button>
              <button onClick={() => navigate('/register')} className="btn btn-teal" style={{flex: 1, padding: '0.5rem 1rem'}}>Register</button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <header style={{
        position: 'relative', 
        padding: '3rem 5%', 
        background: 'linear-gradient(135deg, rgba(13,38,80,0.6), rgba(21,101,192,0.4)), url(/images/hero_wash.png) center center/cover no-repeat',
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        boxShadow: '0 10px 30px rgba(0,0,0,0.15)'
      }}>
        <div style={{maxWidth: '600px', zIndex: 2, color: 'white'}}>
          <h1 style={{fontSize: 'clamp(2rem, 6vw, 3.5rem)', marginBottom: '1rem', lineHeight: 1.1, color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.5)'}}>
            Professional Car Wash <br/> at Your Doorstep
          </h1>
          <p style={{fontSize: 'clamp(1rem, 3.5vw, 1.25rem)', color: 'rgba(255,255,255,0.95)', marginBottom: '2rem', textShadow: '0 1px 2px rgba(0,0,0,0.4)'}}>
            Fast, affordable, and eco-friendly car cleaning in Visakhapatnam.
          </p>
          <div style={{display: 'flex', gap: '1rem', flexWrap: 'wrap'}}>
            <button onClick={() => navigate('/login')} className="btn btn-teal" style={{padding: '0.8rem 2rem', fontSize: '1.05rem', flex: '1 1 auto', boxShadow: '0 4px 6px rgba(0,0,0,0.2)'}}>Book Now</button>
            <button className="btn btn-outline" style={{padding: '0.8rem 2rem', fontSize: '1.05rem', color: 'white', borderColor: 'white', background: 'rgba(0,0,0,0.3)', flex: '1 1 auto', backdropFilter: 'blur(4px)'}}>Call Us</button>
          </div>
        </div>
      </header>

      {/* Services Section */}
      <section id="services" style={{padding: '5rem 5%', textAlign: 'center'}}>
        <h2 style={{fontSize: '2.5rem', marginBottom: '3rem'}}>Our Services</h2>
        <div className="grid md:grid-cols-3 gap-8" style={{maxWidth: '1200px', margin: '0 auto'}}>
          
          <div className="card" style={{padding: 0, overflow: 'hidden'}}>
            <div style={{padding: '1.5rem', textAlign: 'center', background: 'white'}}>
              <h3 style={{fontSize: '1.5rem', color: 'var(--primary-navy)', marginBottom: '0.25rem'}}>Basic Wash</h3>
              {/* <p style={{color: 'var(--text-muted)', fontWeight: 600}}>From ₹499</p> */}
            </div>
            <img src="/images/basic_wash.png" alt="Basic Wash" style={{width: '100%', height: '220px', objectFit: 'cover'}} />
          </div>

          <div className="card" style={{padding: 0, overflow: 'hidden', transform: 'scale(1.05)', zIndex: 2, boxShadow: 'var(--shadow-lg)'}}>
            <div style={{padding: '1.5rem', textAlign: 'center', background: 'white'}}>
              <h3 style={{fontSize: '1.5rem', color: 'var(--primary-navy)', marginBottom: '0.25rem'}}>Premium Wash</h3>
              {/* <p style={{color: 'var(--text-muted)', fontWeight: 600}}>From ₹899</p> */}
            </div>
            <img src="/images/premium_wash.png" alt="Premium Wash" style={{width: '100%', height: '240px', objectFit: 'cover'}} />
          </div>

          <div className="card" style={{padding: 0, overflow: 'hidden'}}>
            <div style={{padding: '1.5rem', textAlign: 'center', background: 'white'}}>
              <h3 style={{fontSize: '1.5rem', color: 'var(--primary-navy)', marginBottom: '0.25rem'}}>Full Detailing</h3>
              {/* <p style={{color: 'var(--text-muted)', fontWeight: 600}}>From ₹2499</p> */}
            </div>
            <img src="/images/full_detailing.png" alt="Full Detailing" style={{width: '100%', height: '220px', objectFit: 'cover'}} />
          </div>

        </div>
        <div style={{marginTop: '3rem'}}>
          <button onClick={() => navigate('/login')} className="btn btn-teal" style={{padding: '0.75rem 2rem'}}>View All Services</button>
        </div>
      </section>

      {/* Why Choose Us */}
      <section style={{padding: '4rem 5%', background: 'linear-gradient(to bottom, transparent, #E0F2FE 15%, #E0F2FE 85%, transparent)'}}>
        <h2 style={{fontSize: '2.5rem', marginBottom: '3rem', textAlign: 'center'}}>Why Choose WASH MY CAR</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6" style={{maxWidth: '1000px', margin: '0 auto'}}>
          
          <div className="card" style={{textAlign: 'center', padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
            <div style={{width: '60px', height: '60px', borderRadius: '50%', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', color: 'var(--primary-blue)'}}>
              <Award size={30} />
            </div>
            <h4 style={{fontWeight: 700, color: 'var(--primary-navy)'}}>Experienced<br/>Professionals</h4>
          </div>

          <div className="card" style={{textAlign: 'center', padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
            <div style={{width: '60px', height: '60px', borderRadius: '50%', background: '#ECFCCB', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', color: '#65A30D'}}>
              <span style={{fontSize: '1.5rem', fontWeight: 800}}>₹</span>
            </div>
            <h4 style={{fontWeight: 700, color: 'var(--primary-navy)'}}>Affordable<br/>Pricing</h4>
          </div>

          <div className="card" style={{textAlign: 'center', padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
            <div style={{width: '60px', height: '60px', borderRadius: '50%', background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', color: '#059669'}}>
              <Leaf size={30} />
            </div>
            <h4 style={{fontWeight: 700, color: 'var(--primary-navy)'}}>Eco-Friendly<br/>Products</h4>
          </div>

          <div className="card" style={{textAlign: 'center', padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
            <div style={{width: '60px', height: '60px', borderRadius: '50%', background: '#E0E7FF', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', color: '#4338CA'}}>
              <Car size={30} />
            </div>
            <h4 style={{fontWeight: 700, color: 'var(--primary-navy)'}}>Doorstep<br/>Service</h4>
          </div>

        </div>
      </section>

      {/* How it Works */}
      <section style={{padding: '5rem 5%', textAlign: 'center'}}>
        <h2 style={{fontSize: '2.5rem', marginBottom: '3rem'}}>How It Works</h2>
        <div className="grid md:grid-cols-4 gap-6" style={{maxWidth: '1100px', margin: '0 auto'}}>
          
          <div style={{position: 'relative'}}>
            <div style={{width: '40px', height: '40px', background: 'var(--primary-blue)', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, margin: '0 auto -20px', position: 'relative', zIndex: 2}}>1</div>
            <div className="card" style={{padding: '3rem 1.5rem 1.5rem'}}>
              <Car size={40} color="var(--primary-blue)" style={{margin: '0 auto 1rem'}} />
              <h4 style={{fontWeight: 600}}>Choose Your Service</h4>
            </div>
          </div>

          <div style={{position: 'relative'}}>
            <div style={{width: '40px', height: '40px', background: 'var(--primary-blue)', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, margin: '0 auto -20px', position: 'relative', zIndex: 2}}>2</div>
            <div className="card" style={{padding: '3rem 1.5rem 1.5rem'}}>
              <Calendar size={40} color="var(--primary-blue)" style={{margin: '0 auto 1rem'}} />
              <h4 style={{fontWeight: 600}}>Pick Date & Time</h4>
            </div>
          </div>

          <div style={{position: 'relative'}}>
            <div style={{width: '40px', height: '40px', background: 'var(--primary-blue)', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, margin: '0 auto -20px', position: 'relative', zIndex: 2}}>3</div>
            <div className="card" style={{padding: '3rem 1.5rem 1.5rem'}}>
              <MapPin size={40} color="var(--primary-blue)" style={{margin: '0 auto 1rem'}} />
              <h4 style={{fontWeight: 600}}>We Come to You</h4>
            </div>
          </div>

          <div style={{position: 'relative'}}>
            <div style={{width: '40px', height: '40px', background: 'var(--primary-blue)', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, margin: '0 auto -20px', position: 'relative', zIndex: 2}}>4</div>
            <div className="card" style={{padding: '3rem 1.5rem 1.5rem'}}>
              <CheckCircle size={40} color="var(--primary-blue)" style={{margin: '0 auto 1rem'}} />
              <h4 style={{fontWeight: 600}}>Enjoy Clean Car!</h4>
            </div>
          </div>

        </div>
      </section>

      {/* Banner */}
      <section style={{background: 'linear-gradient(90deg, var(--primary-blue), var(--primary-navy))', color: 'white', padding: '3rem 5%', textAlign: 'center', display: 'flex', flexDirection: 'column', md:{flexDirection: 'row'}, alignItems: 'center', justifyContent: 'center', gap: '2rem'}}>
        <h2 style={{color: 'white', margin: 0, fontSize: '2rem'}}>Get 20% OFF Your First Wash!</h2>
        <button onClick={() => navigate('/register')} className="btn btn-teal" style={{padding: '0.75rem 2rem'}}>Claim Offer</button>
      </section>

      {/* Contact Section */}
      <section id="contact" style={{padding: '5rem 5%', maxWidth: '1200px', margin: '0 auto'}}>
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h2 style={{fontSize: '2rem', marginBottom: '1rem', color: 'var(--primary-navy)'}}>Serving Visakhapatnam & Surrounds</h2>
            <p style={{color: 'var(--text-muted)', marginBottom: '2rem'}}>We proudly serve all Visakhapatnam neighborhoods!</p>
            
            <div className="card" style={{background: 'linear-gradient(to bottom, var(--primary-blue), #0ea5e9)', color: 'white', padding: 0, overflow: 'hidden'}}>
              <div style={{padding: '1.5rem', background: 'rgba(0,0,0,0.1)'}}>
                <h3 style={{color: 'white', margin: 0}}>Contact Us</h3>
              </div>
              <div style={{padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', background: 'white', color: 'var(--text-dark)'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                  <Phone color="var(--primary-blue)" />
                  <span style={{fontWeight: 600}}>Call: +91 98765 43210</span>
                </div>
                <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                  <Mail color="var(--primary-blue)" />
                  <span style={{fontWeight: 600}}>Email: washmycarorg@gmail.com</span>
                </div>
                <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                  <MapPin color="var(--primary-blue)" />
                  <span style={{fontWeight: 600}}>Headquarters: Sujatha Nagar, Vizag</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <img src="/images/map_vizag.png" alt="Map of Visakhapatnam" style={{width: '100%', height: '300px', objectFit: 'cover', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)', marginBottom: '1.5rem'}} />
            <div style={{display: 'flex', gap: '1rem', marginBottom: '1rem'}}>
              <input type="text" placeholder="Your Name" className="form-input" />
              <input type="tel" placeholder="Phone" className="form-input" />
            </div>
            <textarea placeholder="Message" className="form-input" style={{height: '100px', marginBottom: '1rem', resize: 'none'}}></textarea>
            <button className="btn btn-teal" style={{float: 'right'}}>Send Message</button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{padding: '2rem 5%', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem'}}>
        <div style={{color: 'var(--primary-blue)', fontWeight: 600}}>
          Quick Links | Privacy Policy | Terms & Conditions
        </div>
        <div style={{color: 'var(--text-muted)'}}>
          © 2026 Wash My Car. All rights reserved.
        </div>
      </footer>

    </div>
  );
};

export default Home;
