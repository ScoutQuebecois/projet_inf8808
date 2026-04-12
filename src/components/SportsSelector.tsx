import React, { useState, useMemo, useRef, useEffect } from 'react';

interface Props {
    allSports: string[];
    selectedSports: string[];
    onAdd: (sport: string) => void;
    onRemove: (sport: string) => void;
    
}

const SportSelector: React.FC<Props> = ({ allSports, selectedSports, onAdd, onRemove }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Fermer le dropdown si on clique en dehors du composant
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Logique de filtrage et tri
    const filteredSports = useMemo(() => {
        const available = allSports.filter(s => !selectedSports.includes(s));
        
        if (searchTerm.trim() === "") {
            return available.slice(0, 20); // Top 20 alphabétique si vide
        }

        return available
            .filter(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
            .slice(0, 20);
    }, [allSports, selectedSports, searchTerm]);

    return (
        <div ref={containerRef} style={{ width: '100%', maxWidth: '500px', position: 'relative' }}>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>
                Sports à comparer :
            </label>
            
            {/* Chips des sports sélectionnés */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                {selectedSports.map(sport => (
                    <div key={sport} style={chipStyle}>
                        {sport}
                        <span onClick={() => onRemove(sport)} style={removeBtnStyle}>×</span>
                    </div>
                ))}
            </div>

            {/* Barre de recherche */}
            <div style={{ position: 'relative' }}>
                <input
                    type="text"
                    placeholder="Cliquez pour voir la liste ou recherchez..."
                    value={searchTerm}
                    onFocus={() => setIsOpen(true)}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={inputStyle}
                />
                
                {/* Dropdown */}
                {isOpen && (
                    <div style={dropdownStyle}>
                        {filteredSports.length > 0 ? (
                            filteredSports.map(sport => (
                                <div 
                                    key={sport} 
                                    onClick={() => {
                                        onAdd(sport);
                                        setSearchTerm("");
                                    }}
                                    style={itemStyle}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                    {sport}
                                </div>
                            ))
                        ) : (
                            <div style={{padding: '10px', color: '#999'}}>Aucun sport trouvé</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

// Styles
const chipStyle: React.CSSProperties = {
    background: '#007bff', color: 'white', padding: '5px 12px', 
    borderRadius: '20px', display: 'flex', alignItems: 'center', fontSize: '13px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
};

const removeBtnStyle: React.CSSProperties = {
    marginLeft: '8px', cursor: 'pointer', fontSize: '16px', lineHeight: '1'
};

const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px', borderRadius: '6px', 
    border: '1px solid #ddd', fontSize: '14px', outline: 'none'
};

const dropdownStyle: React.CSSProperties = {
    position: 'absolute', top: '105%', left: 0, right: 0, 
    background: 'white', border: '1px solid #ddd', zIndex: 100,
    boxShadow: '0 8px 16px rgba(0,0,0,0.15)', borderRadius: '6px',
    maxHeight: '250px', overflowY: 'auto'
};

const itemStyle: React.CSSProperties = {
    padding: '10px 15px', cursor: 'pointer', borderBottom: '1px solid #f5f5f5',
    fontSize: '14px', transition: 'background 0.2s'
};

export default SportSelector;