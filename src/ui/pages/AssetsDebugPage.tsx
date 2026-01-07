import { useEffect } from "react";
import { illustrations } from "../../assets/illustrations";

export default function AssetsDebugPage() {
  useEffect(() => {
    // Console.log de todas as URLs para debug
    console.log("=== DEBUG: URLs das ilustrações ===");
    console.log("empty.accounts:", illustrations.empty.accounts);
    console.log("empty.transactions:", illustrations.empty.transactions);
    console.log("empty.categories:", illustrations.empty.categories);
    console.log("empty.goals:", illustrations.empty.goals);
    console.log("empty.budgets:", illustrations.empty.budgets);
    console.log("empty.search:", illustrations.empty.search);
    console.log("premium.locked:", illustrations.premium.locked);
    console.log("premium.active:", illustrations.premium.active);
    console.log("premium.upgrade:", illustrations.premium.upgrade);
    console.log("errors.generic:", illustrations.errors.generic);
    console.log("errors.database:", illustrations.errors.database);
    console.log("===================================");
  }, []);

  const imageItems = [
    { category: "Empty States", items: [
      { key: "accounts", label: "Empty Accounts", src: illustrations.empty.accounts },
      { key: "transactions", label: "Empty Transactions", src: illustrations.empty.transactions },
      { key: "categories", label: "Empty Categories", src: illustrations.empty.categories },
      { key: "goals", label: "Empty Goals", src: illustrations.empty.goals },
      { key: "budgets", label: "Empty Budgets", src: illustrations.empty.budgets },
      { key: "search", label: "Empty Search", src: illustrations.empty.search },
    ]},
    { category: "Premium", items: [
      { key: "locked", label: "Premium Locked", src: illustrations.premium.locked },
      { key: "active", label: "Premium Active", src: illustrations.premium.active },
      { key: "upgrade", label: "Upgrade Premium", src: illustrations.premium.upgrade },
    ]},
    { category: "Errors", items: [
      { key: "generic", label: "Error Generic", src: illustrations.errors.generic },
      { key: "database", label: "Error Database", src: illustrations.errors.database },
    ]},
  ];

  return (
    <div className="content-area" style={{ padding: "2rem" }}>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 600, marginBottom: "2rem", color: "var(--text-primary)" }}>
        Debug de Ilustrações
      </h1>
      
      <div style={{ marginBottom: "1rem", padding: "1rem", background: "var(--bg-secondary)", borderRadius: "8px" }}>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
          Abra o console do navegador (F12) para ver as URLs geradas de cada ilustração.
        </p>
      </div>

      {imageItems.map((category) => (
        <div key={category.category} style={{ marginBottom: "3rem" }}>
          <h2 style={{ 
            fontSize: "1.25rem", 
            fontWeight: 600, 
            marginBottom: "1.5rem", 
            color: "var(--text-primary)",
            borderBottom: "2px solid var(--border-color)",
            paddingBottom: "0.5rem"
          }}>
            {category.category}
          </h2>
          
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", 
            gap: "2rem" 
          }}>
            {category.items.map((item) => (
              <div 
                key={item.key}
                style={{
                  background: "var(--card-bg)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "8px",
                  padding: "1.5rem",
                  boxShadow: "var(--card-shadow)",
                }}
              >
                <h3 style={{ 
                  fontSize: "1rem", 
                  fontWeight: 500, 
                  marginBottom: "1rem",
                  color: "var(--text-primary)"
                }}>
                  {item.label}
                </h3>
                <div style={{ 
                  background: "var(--bg-secondary)", 
                  borderRadius: "4px", 
                  padding: "1rem",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  minHeight: "200px"
                }}>
                  <img 
                    src={item.src} 
                    alt={item.label}
                    style={{
                      maxWidth: "420px",
                      width: "100%",
                      height: "auto",
                    }}
                    onError={(e) => {
                      console.error(`Erro ao carregar imagem: ${item.label}`, item.src);
                      (e.target as HTMLImageElement).style.border = "2px solid var(--error)";
                    }}
                    onLoad={() => {
                      console.log(`✓ Imagem carregada: ${item.label}`, item.src);
                    }}
                  />
                </div>
                <div style={{ 
                  marginTop: "0.75rem", 
                  fontSize: "0.75rem", 
                  color: "var(--text-tertiary)",
                  fontFamily: "monospace",
                  wordBreak: "break-all"
                }}>
                  {item.src}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

