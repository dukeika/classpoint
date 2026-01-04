"use client";

import { useEffect, useMemo, useState } from "react";
import { decodeToken } from "../../../components/auth-utils";
import { graphqlFetch } from "../../../components/graphql";
import { useStaffAuth } from "../../../components/staff-auth";

type Plan = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  billingCycle: string;
  basePrice: number;
  currency: string;
  status: string;
};

type AddOn = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  pricingModel: string;
  price: number;
  status: string;
};

export default function CatalogPage() {
  const { token } = useStaffAuth();
  const isAppAdmin = useMemo(() => {
    const groups = decodeToken(token)?.["cognito:groups"] || [];
    return Array.isArray(groups) && groups.includes("APP_ADMIN");
  }, [token]);

  const [plans, setPlans] = useState<Plan[]>([]);
  const [addOns, setAddOns] = useState<AddOn[]>([]);
  const [loading, setLoading] = useState(false);

  const [planStatus, setPlanStatus] = useState("");
  const [planEditingId, setPlanEditingId] = useState<string | null>(null);
  const [planCode, setPlanCode] = useState("SCHOOL_BASIC");
  const [planName, setPlanName] = useState("School Basic");
  const [planDescription, setPlanDescription] = useState("");
  const [planBillingCycle, setPlanBillingCycle] = useState("MONTHLY");
  const [planBasePrice, setPlanBasePrice] = useState("0");
  const [planCurrency, setPlanCurrency] = useState("NGN");
  const [planState, setPlanState] = useState("ACTIVE");

  const [addOnStatus, setAddOnStatus] = useState("");
  const [addOnEditingId, setAddOnEditingId] = useState<string | null>(null);
  const [addOnCode, setAddOnCode] = useState("EXTRA_SMS");
  const [addOnName, setAddOnName] = useState("Extra SMS");
  const [addOnDescription, setAddOnDescription] = useState("");
  const [addOnPricingModel, setAddOnPricingModel] = useState("FLAT");
  const [addOnPrice, setAddOnPrice] = useState("0");
  const [addOnState, setAddOnState] = useState("ACTIVE");

  const loadPlans = async () => {
    if (!token || !isAppAdmin) return;
    setLoading(true);
    setPlanStatus("");
    try {
      const data = await graphqlFetch<{ plans: Plan[] }>(
        `query Plans($limit: Int) {
          plans(limit: $limit) {
            id
            code
            name
            description
            billingCycle
            basePrice
            currency
            status
          }
        }`,
        { limit: 100 },
        token
      );
      setPlans(data.plans || []);
    } catch (err) {
      setPlanStatus(err instanceof Error ? err.message : "Failed to load plans.");
    } finally {
      setLoading(false);
    }
  };

  const loadAddOns = async () => {
    if (!token || !isAppAdmin) return;
    setLoading(true);
    setAddOnStatus("");
    try {
      const data = await graphqlFetch<{ addOns: AddOn[] }>(
        `query AddOns($limit: Int) {
          addOns(limit: $limit) {
            id
            code
            name
            description
            pricingModel
            price
            status
          }
        }`,
        { limit: 100 },
        token
      );
      setAddOns(data.addOns || []);
    } catch (err) {
      setAddOnStatus(err instanceof Error ? err.message : "Failed to load add-ons.");
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    await Promise.all([loadPlans(), loadAddOns()]);
  };

  useEffect(() => {
    if (token && isAppAdmin) {
      refresh();
    }
  }, [token, isAppAdmin]);

  const resetPlanForm = () => {
    setPlanEditingId(null);
    setPlanCode("SCHOOL_BASIC");
    setPlanName("School Basic");
    setPlanDescription("");
    setPlanBillingCycle("MONTHLY");
    setPlanBasePrice("0");
    setPlanCurrency("NGN");
    setPlanState("ACTIVE");
  };

  const resetAddOnForm = () => {
    setAddOnEditingId(null);
    setAddOnCode("EXTRA_SMS");
    setAddOnName("Extra SMS");
    setAddOnDescription("");
    setAddOnPricingModel("FLAT");
    setAddOnPrice("0");
    setAddOnState("ACTIVE");
  };

  const savePlan = async () => {
    if (!token || !isAppAdmin || !planCode || !planName) return;
    const basePrice = Number(planBasePrice);
    if (!Number.isFinite(basePrice)) {
      setPlanStatus("Base price must be a number.");
      return;
    }
    setLoading(true);
    setPlanStatus("");
    try {
      if (planEditingId) {
        await graphqlFetch(
          `mutation UpdatePlan($input: UpdatePlanInput!) {
            updatePlan(input: $input) { id }
          }`,
          {
            input: {
              id: planEditingId,
              code: planCode,
              name: planName,
              description: planDescription || null,
              billingCycle: planBillingCycle,
              basePrice,
              currency: planCurrency,
              status: planState
            }
          },
          token
        );
        setPlanStatus("Plan updated.");
      } else {
        await graphqlFetch(
          `mutation CreatePlan($input: CreatePlanInput!) {
            createPlan(input: $input) { id }
          }`,
          {
            input: {
              code: planCode,
              name: planName,
              description: planDescription || null,
              billingCycle: planBillingCycle,
              basePrice,
              currency: planCurrency,
              status: planState
            }
          },
          token
        );
        setPlanStatus("Plan created.");
      }
      resetPlanForm();
      await loadPlans();
    } catch (err) {
      setPlanStatus(err instanceof Error ? err.message : "Failed to save plan.");
    } finally {
      setLoading(false);
    }
  };

  const saveAddOn = async () => {
    if (!token || !isAppAdmin || !addOnCode || !addOnName) return;
    const price = Number(addOnPrice);
    if (!Number.isFinite(price)) {
      setAddOnStatus("Price must be a number.");
      return;
    }
    setLoading(true);
    setAddOnStatus("");
    try {
      if (addOnEditingId) {
        await graphqlFetch(
          `mutation UpdateAddOn($input: UpdateAddOnInput!) {
            updateAddOn(input: $input) { id }
          }`,
          {
            input: {
              id: addOnEditingId,
              code: addOnCode,
              name: addOnName,
              description: addOnDescription || null,
              pricingModel: addOnPricingModel,
              price,
              status: addOnState
            }
          },
          token
        );
        setAddOnStatus("Add-on updated.");
      } else {
        await graphqlFetch(
          `mutation CreateAddOn($input: CreateAddOnInput!) {
            createAddOn(input: $input) { id }
          }`,
          {
            input: {
              code: addOnCode,
              name: addOnName,
              description: addOnDescription || null,
              pricingModel: addOnPricingModel,
              price,
              status: addOnState
            }
          },
          token
        );
        setAddOnStatus("Add-on created.");
      }
      resetAddOnForm();
      await loadAddOns();
    } catch (err) {
      setAddOnStatus(err instanceof Error ? err.message : "Failed to save add-on.");
    } finally {
      setLoading(false);
    }
  };

  const startPlanEdit = (plan: Plan) => {
    setPlanEditingId(plan.id);
    setPlanCode(plan.code);
    setPlanName(plan.name);
    setPlanDescription(plan.description || "");
    setPlanBillingCycle(plan.billingCycle);
    setPlanBasePrice(String(plan.basePrice ?? 0));
    setPlanCurrency(plan.currency);
    setPlanState(plan.status);
  };

  const startAddOnEdit = (addOn: AddOn) => {
    setAddOnEditingId(addOn.id);
    setAddOnCode(addOn.code);
    setAddOnName(addOn.name);
    setAddOnDescription(addOn.description || "");
    setAddOnPricingModel(addOn.pricingModel);
    setAddOnPrice(String(addOn.price ?? 0));
    setAddOnState(addOn.status);
  };

  const deletePlan = async (id: string) => {
    if (!token || !isAppAdmin) return;
    if (!window.confirm("Delete this plan?")) return;
    setLoading(true);
    setPlanStatus("");
    try {
      await graphqlFetch(
        `mutation DeletePlan($id: ID!) {
          deletePlan(id: $id)
        }`,
        { id },
        token
      );
      setPlanStatus("Plan deleted.");
      await loadPlans();
    } catch (err) {
      setPlanStatus(err instanceof Error ? err.message : "Failed to delete plan.");
    } finally {
      setLoading(false);
    }
  };

  const deleteAddOn = async (id: string) => {
    if (!token || !isAppAdmin) return;
    if (!window.confirm("Delete this add-on?")) return;
    setLoading(true);
    setAddOnStatus("");
    try {
      await graphqlFetch(
        `mutation DeleteAddOn($id: ID!) {
          deleteAddOn(id: $id)
        }`,
        { id },
        token
      );
      setAddOnStatus("Add-on deleted.");
      await loadAddOns();
    } catch (err) {
      setAddOnStatus(err instanceof Error ? err.message : "Failed to delete add-on.");
    } finally {
      setLoading(false);
    }
  };

  if (!isAppAdmin) {
    return (
      <main className="dashboard-page">
        <div className="page-header">
          <div>
            <div className="breadcrumb">Admin / Settings</div>
            <h1>Plan catalog</h1>
            <p className="muted">App admins manage platform plans and add-ons.</p>
          </div>
        </div>
        <div className="card">
          <h3>Access limited</h3>
          <p className="muted">Sign in as an app admin to manage the plan catalog.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="dashboard-page">
      <div className="page-header">
        <div>
          <div className="breadcrumb">Admin / Settings</div>
          <h1>Plan catalog</h1>
          <p className="muted">Define subscription plans and add-ons for schools.</p>
        </div>
        <div className="quick-actions">
          <button className="button" onClick={refresh} disabled={loading}>
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      <div className="grid">
        <div className="card">
          <h3>{planEditingId ? "Edit plan" : "New plan"}</h3>
          <div className="form-grid">
            <input placeholder="Plan code" value={planCode} onChange={(event) => setPlanCode(event.target.value)} />
            <input placeholder="Plan name" value={planName} onChange={(event) => setPlanName(event.target.value)} />
            <input
              placeholder="Description (optional)"
              value={planDescription}
              onChange={(event) => setPlanDescription(event.target.value)}
            />
            <input
              placeholder="Billing cycle (MONTHLY/ANNUAL)"
              value={planBillingCycle}
              onChange={(event) => setPlanBillingCycle(event.target.value)}
            />
            <input
              type="number"
              placeholder="Base price"
              value={planBasePrice}
              onChange={(event) => setPlanBasePrice(event.target.value)}
            />
            <input
              placeholder="Currency"
              value={planCurrency}
              onChange={(event) => setPlanCurrency(event.target.value)}
            />
            <input placeholder="Status" value={planState} onChange={(event) => setPlanState(event.target.value)} />
            <button className="button" onClick={savePlan} disabled={loading || !planCode || !planName}>
              {planEditingId ? "Update plan" : "Create plan"}
            </button>
            <button className="button secondary" type="button" onClick={resetPlanForm} disabled={loading}>
              Clear
            </button>
            {planStatus && <p className="muted">{planStatus}</p>}
          </div>
        </div>

        <div className="card">
          <h3>Existing plans</h3>
          <div className="list">
            {plans.length === 0 && <p className="muted">No plans yet.</p>}
            {plans.map((plan) => (
              <div key={plan.id} className="line-item">
                <div>
                  <strong>{plan.name}</strong>
                  <small>{plan.code}</small>
                  <small>
                    {plan.basePrice} {plan.currency} / {plan.billingCycle}
                  </small>
                </div>
                <div>
                  <button className="button" type="button" onClick={() => startPlanEdit(plan)}>
                    Edit
                  </button>
                  <button className="button secondary" type="button" onClick={() => deletePlan(plan.id)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3>{addOnEditingId ? "Edit add-on" : "New add-on"}</h3>
          <div className="form-grid">
            <input placeholder="Add-on code" value={addOnCode} onChange={(event) => setAddOnCode(event.target.value)} />
            <input placeholder="Add-on name" value={addOnName} onChange={(event) => setAddOnName(event.target.value)} />
            <input
              placeholder="Description (optional)"
              value={addOnDescription}
              onChange={(event) => setAddOnDescription(event.target.value)}
            />
            <input
              placeholder="Pricing model (FLAT/PER_STUDENT)"
              value={addOnPricingModel}
              onChange={(event) => setAddOnPricingModel(event.target.value)}
            />
            <input
              type="number"
              placeholder="Price"
              value={addOnPrice}
              onChange={(event) => setAddOnPrice(event.target.value)}
            />
            <input placeholder="Status" value={addOnState} onChange={(event) => setAddOnState(event.target.value)} />
            <button className="button" onClick={saveAddOn} disabled={loading || !addOnCode || !addOnName}>
              {addOnEditingId ? "Update add-on" : "Create add-on"}
            </button>
            <button className="button secondary" type="button" onClick={resetAddOnForm} disabled={loading}>
              Clear
            </button>
            {addOnStatus && <p className="muted">{addOnStatus}</p>}
          </div>
        </div>

        <div className="card">
          <h3>Existing add-ons</h3>
          <div className="list">
            {addOns.length === 0 && <p className="muted">No add-ons yet.</p>}
            {addOns.map((addOn) => (
              <div key={addOn.id} className="line-item">
                <div>
                  <strong>{addOn.name}</strong>
                  <small>{addOn.code}</small>
                  <small>{addOn.price}</small>
                </div>
                <div>
                  <button className="button" type="button" onClick={() => startAddOnEdit(addOn)}>
                    Edit
                  </button>
                  <button className="button secondary" type="button" onClick={() => deleteAddOn(addOn.id)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
