import GlowButton from "../components/GlowButton";

const Notifications = () => {
  return (
    <div className="h-screen flex items-center justify-center">
      <GlowButton onClick={() => alert("clicked")}>+ Create Policy</GlowButton>
    </div>
  );
};

export default Notifications;
