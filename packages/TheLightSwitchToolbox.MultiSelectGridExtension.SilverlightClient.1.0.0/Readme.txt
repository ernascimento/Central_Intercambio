
How to use the Extension method?

- Make sure to have an Observable collection for storing the selected items
- call the AddCheckBoxColumnForMultiSelection from the InitializeDataWorkspace event
- tweak the Execute and CanExecute method.


public partial class EditableProductsGrid
    {
        ObservableCollection<Product> SelectedProducts = new ObservableCollection<Product>();

        partial void EditableProductsGrid_InitializeDataWorkspace(List<IDataService> saveChangesTo)
        {
            this.FindControl("grid").AddCheckBoxColumnForMultiSelection<Product>(SelectedProducts);
        }

        partial void DoSomethingWithSelection_Execute()
        {
            foreach (var item in SelectedProducts)
            {
                this.ShowMessageBox(item.ProductName);
            }
        }

        partial void DoSomethingWithSelection_CanExecute(ref bool result)
        {
            result = this.Products.SelectedItem != null && SelectedProducts.Count >= 1; ;
        }
}