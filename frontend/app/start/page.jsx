'use client'
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateFirmPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    budget: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const res = await fetch('http://localhost:8000/api/create-firm/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    if (res.ok) {
      const data = await res.json();

      // Optionally store the initial response locally
      localStorage.setItem('initial_plan', data.business_plan);
      localStorage.setItem('business_id', data.business_id);

      router.push('/chat');
    } else {
      const error = await res.json();
      alert('Initialization failed: ' + error.detail);
    }

    setLoading(false);
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold text-center mb-4">Инициализация на фирма</h2>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block mb-2">Име на фирмата</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="border p-2 rounded w-full"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-2">Описание на бизнеса</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            className="border p-2 rounded w-full"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-2">Бюджет (в лева)</label>
          <input
            type="number"
            name="budget"
            value={formData.budget}
            onChange={handleChange}
            required
            className="border p-2 rounded w-full"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded w-full"
        >
          {loading ? 'Инициализация...' : 'Създай фирма и започни чат'}
        </button>
      </form>
    </div>
  );
}
