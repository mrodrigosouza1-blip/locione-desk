import { useEffect, useState } from "react";
import { categoryRepository } from "../../infra/repositories/categoryRepository";
import Topbar from "../components/Topbar";
import Modal from "../components/Modal";
import { useI18n } from "../../i18n/I18nProvider";
import { CK } from "../../i18n/keys/categoriesKeys";
import { AK } from "../../i18n/keys/appKeys";
import { useToast } from "../hooks/useToast";
import { requireGate } from "../../services/requireGate";
import { getUsageCounters } from "../../services/usageCounters";
import { useNavigate } from "react-router-dom";
import EmptyState from "../../shared/components/EmptyState";
import { illustrations } from "../../assets/illustrations";
import {
  Plus,
  Tag,
  ShoppingCart,
  Home,
  Car,
  Utensils,
  Heart,
  GraduationCap,
  Music,
  Gamepad2,
  Briefcase,
  Plane,
  Coffee,
  Building,
  DollarSign,
  Edit,
  Trash2,
  Search,
} from "lucide-react";

export default function CategoriesPage() {
  const { t } = useI18n();
  const toast = useToast();
  const navigate = useNavigate();
  
  // Lista de ícones disponíveis do lucide-react
  const availableIcons = [
    { name: "tag", labelKey: CK.icons.tag, icon: Tag },
    { name: "shopping-cart", labelKey: CK.icons.shoppingCart, icon: ShoppingCart },
    { name: "home", labelKey: CK.icons.home, icon: Home },
    { name: "car", labelKey: CK.icons.car, icon: Car },
    { name: "utensils", labelKey: CK.icons.utensils, icon: Utensils },
    { name: "heart", labelKey: CK.icons.heart, icon: Heart },
    { name: "graduation-cap", labelKey: CK.icons.graduationCap, icon: GraduationCap },
    { name: "music", labelKey: CK.icons.music, icon: Music },
    { name: "gamepad-2", labelKey: CK.icons.gamepad2, icon: Gamepad2 },
    { name: "briefcase", labelKey: CK.icons.briefcase, icon: Briefcase },
    { name: "plane", labelKey: CK.icons.plane, icon: Plane },
    { name: "coffee", labelKey: CK.icons.coffee, icon: Coffee },
    { name: "building", labelKey: CK.icons.building, icon: Building },
    { name: "dollar-sign", labelKey: CK.icons.dollarSign, icon: DollarSign },
  ];

// Função helper para renderizar ícone pelo nome
function getIconByName(iconName: string) {
  const iconEntry = availableIcons.find((i) => i.name === iconName);
  if (iconEntry) {
    const IconComponent = iconEntry.icon;
    return <IconComponent size={24} />;
  }
  // Fallback para Tag se não encontrar
  return <Tag size={24} />;
}

  const [categories, setCategories] = useState<any[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    icon: "tag",
  });

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (search) {
      setFilteredCategories(
        categories.filter((c) =>
          c.name.toLowerCase().includes(search.toLowerCase())
        )
      );
    } else {
      setFilteredCategories(categories);
    }
  }, [search, categories]);

  async function loadCategories() {
    const cats = await categoryRepository.findAll();
    setCategories(cats);
    setFilteredCategories(cats);
  }

  function openCreateModal() {
    const counters = getUsageCounters();
    if (!requireGate("categories.create", counters, toast, navigate, t)) {
      return;
    }
    setFormData({ name: "", icon: "tag" });
    setIsModalOpen(true);
  }

  function openEditModal(category: any) {
    setEditingCategory(category);
    setFormData({ name: category.name, icon: category.icon });
    setIsEditModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      // Aplicar gate
      const counters = getUsageCounters();
      if (!requireGate("categories.create", counters, toast, navigate, t)) {
        return;
      }
      
      await categoryRepository.create(formData);
      setIsModalOpen(false);
      setFormData({ name: "", icon: "tag" });
      await loadCategories();
    } catch (error: any) {
      const msg = error instanceof Error && error.message ? error.message : t(CK.messages.createError);
      toast.error(msg);
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editingCategory) return;
    try {
      await categoryRepository.update(editingCategory.id, formData);
      setIsEditModalOpen(false);
      setEditingCategory(null);
      setFormData({ name: "", icon: "tag" });
      await loadCategories();
    } catch (error: any) {
      const msg = error instanceof Error && error.message ? error.message : t(CK.messages.updateError);
      toast.error(msg);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm(t(CK.messages.deleteConfirm))) {
      return;
    }
    try {
      await categoryRepository.delete(id);
      await loadCategories();
    } catch (error: any) {
      const msg = error instanceof Error && error.message ? error.message : t(CK.messages.deleteError);
      toast.error(msg);
    }
  }

  const displayCategories = search ? filteredCategories : categories;
  const hasOnlySystemCategory = displayCategories.length === 1 && displayCategories[0]?.is_system;

  return (
    <>
      <Topbar
        title={t(CK.title)}
        subtitle={t(CK.subtitle)}
        primaryAction={{
          label: t(AK.common.create),
          onClick: () => {
            const counters = getUsageCounters();
            if (!requireGate("categories.create", counters, toast, navigate, t)) {
              return;
            }
            setIsModalOpen(true);
          },
          icon: <Plus size={16} />,
          variant: "primary",
        }}
        showLockNow={true}
      />
      <div className="content-area">
        <div style={{ marginBottom: "1rem" }}>
          <div style={{ position: "relative", maxWidth: "400px" }}>
            <Search size={16} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)" }} />
            <input
              className="input"
              type="text"
              placeholder={t(CK.search.placeholder)}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: "2.5rem" }}
            />
          </div>
        </div>

        {!displayCategories || displayCategories.length === 0 ? (
          <EmptyState
            image={illustrations.empty.categories}
            title={t(CK.empty.title)}
            action={
              <button 
                className="btn btn-primary"
                onClick={openCreateModal}
              >
                <Plus size={16} />
                {t(AK.common.create)}
              </button>
            }
          />
        ) : hasOnlySystemCategory ? (
          <EmptyState
            image={illustrations.empty.categories}
            title={t(CK.empty.onlySystem)}
            description={t(CK.empty.subtitle)}
            action={
              <button 
                className="btn btn-primary"
                onClick={openCreateModal}
              >
                <Plus size={16} />
                {t(CK.empty.createFirst)}
              </button>
            }
          />
        ) : (
          <div className="grid grid-4">
            {displayCategories.map((category) => {
              const isSystem = category.is_system || category.id === 1 || category.name === "Sem categoria";
              return (
                <div key={category.id} className="card">
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
                    <div style={{ color: "var(--accent-primary)" }}>
                      {getIconByName(category.icon)}
                    </div>
                    <h3 style={{ fontSize: "1rem", fontWeight: 600, flex: 1 }}>{category.name}</h3>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                    <button
                      className="btn btn-secondary"
                      onClick={() => openEditModal(category)}
                      style={{ padding: "0.25rem 0.5rem", fontSize: "0.875rem" }}
                      title={t(CK.actions.edit)}
                    >
                      <Edit size={14} />
                    </button>
                    {!isSystem && (
                      <button
                        className="btn btn-secondary"
                        onClick={() => handleDelete(category.id)}
                        style={{ padding: "0.25rem 0.5rem", fontSize: "0.875rem", color: "var(--error)" }}
                        title={t(CK.actions.delete)}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal Criar */}
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={t(CK.modals.create.title)}>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="label">{t(CK.fields.name)}</label>
              <input
                className="input"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder={t(CK.modals.create.namePlaceholder)}
              />
            </div>
            <div className="form-group">
              <label className="label">{t(CK.fields.icon)}</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.5rem", marginTop: "0.5rem" }}>
                {availableIcons.map((iconEntry) => {
                  const IconComponent = iconEntry.icon;
                  const isSelected = formData.icon === iconEntry.name;
                  return (
                    <button
                      key={iconEntry.name}
                      type="button"
                      onClick={() => setFormData({ ...formData, icon: iconEntry.name })}
                      style={{
                        padding: "1rem",
                        border: `2px solid ${isSelected ? "var(--accent-primary)" : "var(--border)"}`,
                        borderRadius: "8px",
                        background: isSelected ? "var(--bg-secondary)" : "transparent",
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "0.25rem",
                      }}
                    >
                      <IconComponent size={24} style={{ color: isSelected ? "var(--accent-primary)" : "var(--text-secondary)" }} />
                      <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>{t(iconEntry.labelKey)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", marginTop: "1.5rem" }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                {t(CK.actions.cancel)}
              </button>
              <button type="submit" className="btn btn-primary">
                {t(CK.actions.create)}
              </button>
            </div>
          </form>
        </Modal>

        {/* Modal Editar */}
        <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={t(CK.modals.edit.title)}>
          <form onSubmit={handleUpdate}>
            <div className="form-group">
              <label className="label">{t(CK.fields.name)}</label>
              <input
                className="input"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                disabled={editingCategory?.is_system || editingCategory?.id === 1 || editingCategory?.name === "Sem categoria"}
              />
              {(editingCategory?.is_system || editingCategory?.id === 1 || editingCategory?.name === "Sem categoria") && (
                <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                  {t(CK.modals.edit.systemNameNote)}
                </p>
              )}
            </div>
            <div className="form-group">
              <label className="label">{t(CK.fields.icon)}</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.5rem", marginTop: "0.5rem" }}>
                {availableIcons.map((iconEntry) => {
                  const IconComponent = iconEntry.icon;
                  const isSelected = formData.icon === iconEntry.name;
                  return (
                    <button
                      key={iconEntry.name}
                      type="button"
                      onClick={() => setFormData({ ...formData, icon: iconEntry.name })}
                      style={{
                        padding: "1rem",
                        border: `2px solid ${isSelected ? "var(--accent-primary)" : "var(--border)"}`,
                        borderRadius: "8px",
                        background: isSelected ? "var(--bg-secondary)" : "transparent",
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "0.25rem",
                      }}
                    >
                      <IconComponent size={24} style={{ color: isSelected ? "var(--accent-primary)" : "var(--text-secondary)" }} />
                      <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>{t(iconEntry.labelKey)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", marginTop: "1.5rem" }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsEditModalOpen(false)}>
                {t(CK.actions.cancel)}
              </button>
              <button type="submit" className="btn btn-primary">
                {t(CK.actions.save)}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </>
  );
}
