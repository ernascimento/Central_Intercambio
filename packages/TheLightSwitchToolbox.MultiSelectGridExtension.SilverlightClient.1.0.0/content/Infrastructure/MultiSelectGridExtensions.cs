using Microsoft.LightSwitch;
using Microsoft.LightSwitch.Client;
using Microsoft.LightSwitch.Presentation;
using System;
using System.Linq;
using System.Collections.ObjectModel;
using System.Net;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Documents;
using System.Windows.Ink;
using System.Windows.Input;
using System.Windows.Markup;
using System.Windows.Media;
using System.Windows.Media.Animation;
using System.Windows.Shapes;
using Microsoft.LightSwitch.Framework.Client;
using Microsoft.LightSwitch.Presentation.Extensions;
using System.Diagnostics;
using Microsoft.LightSwitch.Presentation.Implementation;
using System.Collections.Generic;
namespace LightSwitchApplication
{
    public static class MultiSelectGridExtensions
    {
        public static void AddCheckBoxColumnForMultiSelection<T>(this IContentItemProxy gridProxy, ObservableCollection<T> selectedItems) where T : class,IEntityObject
        {
            EventHandler<ControlAvailableEventArgs> gridProxy_ControlAvailable = null;

            gridProxy_ControlAvailable = (s1, e1) =>
            {
                DataGrid dataGrid = e1.Control as DataGrid;
                var contentItem = dataGrid.DataContext as IContentItem;
                var visualCollection = (contentItem.Value) as IVisualCollection;
                dataGrid.LoadingRow += new EventHandler<DataGridRowEventArgs>((s2, e2) =>
                {
                    DataGridColumn column = dataGrid.Columns[0];
                    var checkBox = column.GetCellContent(e2.Row) as CheckBox;
                    T currentRowItem = e2.Row.DataContext as T;
                    if (currentRowItem != null)
                    {
                        checkBox.IsChecked = selectedItems.Contains(currentRowItem);
                    }

                    RoutedEventHandler checkboxClick = null;
                    checkboxClick = (
                        (s3, e3) =>
                        {
                            var selectedItem = dataGrid.SelectedItem as T;
                            if (selectedItem == null)
                            {
                                return;
                            }
                            if (checkBox.IsChecked ?? false)
                            {
                                if (!selectedItems.Contains(selectedItem))
                                {
                                    selectedItems.Add(selectedItem);
                                }
                            }
                            else
                            {
                                selectedItems.Remove(selectedItem);
                            }
                            TriggerCanExecute(visualCollection);
                        });
                    checkBox.Click += checkboxClick;
                });

                var col = new DataGridTemplateColumn();
                var xaml =
                    @"<DataTemplate  xmlns=""http://schemas.microsoft.com/winfx/2006/xaml/presentation"">
                    <CheckBox/>
                </DataTemplate>";
                var dataTemplate = XamlReader.Load(xaml) as DataTemplate;
                col.CellTemplate = dataTemplate;
                dataGrid.Columns.Insert(0, col);

                gridProxy.ControlAvailable -= gridProxy_ControlAvailable;
            };

            gridProxy.ControlAvailable += gridProxy_ControlAvailable;
        }
        private static void TriggerCanExecute(IVisualCollection visualCollection)
        {
            //this will make sure that the CanExecute method is triggered in a potential button for doing something
            //with the selection result.
            //not elegant, but no other option...
            var currentItem = visualCollection.SelectedItem;
            var collection = visualCollection as IEnumerable<IEntityObject>;

            if (!visualCollection.SelectedItem.Equals(collection.Last()))
            {
                visualCollection.SelectedItem = collection.Last();
            }
            else
            {
                visualCollection.SelectedItem = collection.First();
            }
            visualCollection.SelectedItem = currentItem;
        }
    }
}
