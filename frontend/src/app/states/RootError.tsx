export const RootError = ({ error }: { error: Error }) => {
  return <div>Routing Error: {error.message}</div>;
};
