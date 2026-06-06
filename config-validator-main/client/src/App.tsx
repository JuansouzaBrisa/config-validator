import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import LoginPage from "./pages/LoginPage";
import SubmitPage from "./pages/SubmitPage";
import ReviewPage from "./pages/ReviewPage";
import DashboardPage from "./pages/DashboardPage";
import ViewSubmissionPage from "./pages/ViewSubmissionPage";
import UsersManagementPage from "./pages/UsersManagementPage";
import Home from "./pages/Home";
import DashboardLayout from "./components/DashboardLayout";

function AppRoutes() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route>
        <DashboardLayout>
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/dashboard" component={DashboardPage} />
            <Route path="/submit" component={SubmitPage} />
            <Route path="/review" component={ReviewPage} />
            <Route path="/submission/:id" component={ViewSubmissionPage} />
            <Route path="/users" component={UsersManagementPage} />
            <Route path="/404" component={NotFound} />
            <Route component={NotFound} />
          </Switch>
        </DashboardLayout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark" switchable>
        <TooltipProvider>
          <Toaster />
          <AppRoutes />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
