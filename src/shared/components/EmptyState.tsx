import { ReactNode } from "react";

interface EmptyStateProps {
  image: string;
  title: string;
  description?: string;
  action?: ReactNode;
}

/**
 * Componente reutilizável para estados vazios, premium bloqueado e erros.
 * Centraliza conteúdo, limita largura da imagem e previne drag.
 */
export default function EmptyState({
  image,
  title,
  description,
  action,
}: EmptyStateProps) {
  // Debug: verificar se image está definida
  if (!image) {
    console.warn("EmptyState sem imagem:", { title, image });
    return (
      <div
        style={{
          width: "100%",
          minHeight: "320px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          gap: "1rem",
          padding: "2.5rem 2rem",
        }}
      >
        <div
          style={{
            fontSize: "0.75rem",
            color: "var(--text-tertiary)",
            padding: "0.5rem 1rem",
            background: "var(--bg-secondary)",
            borderRadius: "4px",
            marginBottom: "1rem",
          }}
        >
          DEBUG: imagem não definida para este EmptyState
        </div>
        <h2
          style={{
            fontSize: "1.5rem",
            fontWeight: 600,
            color: "var(--text-primary)",
            marginBottom: "0.75rem",
            lineHeight: 1.3,
          }}
        >
          {title}
        </h2>
        {description && (
          <p
            style={{
              fontSize: "1rem",
              color: "var(--text-secondary)",
              marginBottom: "1.5rem",
              maxWidth: "500px",
              lineHeight: 1.6,
            }}
          >
            {description}
          </p>
        )}
        {action && (
          <div style={{ marginTop: "0.5rem" }}>{action}</div>
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        width: "100%",
        minHeight: "320px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        gap: "1rem",
        padding: "2.5rem 2rem",
      }}
    >
      <img
        src={image}
        alt=""
        draggable={false}
        style={{
          width: "100%",
          maxWidth: "420px",
          height: "auto",
          userSelect: "none",
          pointerEvents: "none",
        }}
      />
      <h2
        style={{
          fontSize: "1.5rem",
          fontWeight: 600,
          color: "var(--text-primary)",
          marginBottom: "0.75rem",
          lineHeight: 1.3,
        }}
      >
        {title}
      </h2>
      {description && (
        <p
          style={{
            fontSize: "1rem",
            color: "var(--text-secondary)",
            marginBottom: "1.5rem",
            maxWidth: "500px",
            lineHeight: 1.6,
          }}
        >
          {description}
        </p>
      )}
      {action && (
        <div style={{ marginTop: "0.5rem" }}>{action}</div>
      )}
    </div>
  );
}

