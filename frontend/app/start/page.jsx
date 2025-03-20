export function CreateFirmPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ name: '', description: '', budget: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const token = localStorage.getItem('access');
    
    const res = await fetch('http://localhost:8000/api/REST/create-firm/', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(formData)
    });

    if (res.ok) {
      const data = await res.json();
      localStorage.setItem('business_id', data.business_id);
      router.push('/home');
    } else {
      alert('Failed to create firm');
    }

    setLoading(false);
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold text-center mb-4">Initialize Your Firm</h2>
      <form onSubmit={handleSubmit}>
        <input type="text" name="name" placeholder="Firm Name" onChange={handleChange} required className="border p-2 rounded w-full mb-4" />
        <textarea name="description" placeholder="Business Description" onChange={handleChange} required className="border p-2 rounded w-full mb-4" />
        <input type="number" name="budget" placeholder="Budget" onChange={handleChange} required className="border p-2 rounded w-full mb-4" />
        <button type="submit" disabled={loading} className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded w-full">
          {loading ? 'Initializing...' : 'Create Firm & Start Chat'}
        </button>
      </form>
    </div>
  );
}