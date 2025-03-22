import React from 'react';
import { renderServerComponent } from '../../utils/server-component-utils';

// Simple test server component
const TestServerComponent = ({ text }: { text: string }) => {
  return (
    <div className="server-component">
      <h1>Server Component</h1>
      <p data-testid="test-content">{text}</p>
      <ul>
        <li>Item 1</li>
        <li>Item 2</li>
      </ul>
    </div>
  );
};

describe('Server Component Utils', () => {
  it('should render a server component to HTML', async () => {
    // Arrange & Act
    const { html } = await renderServerComponent(TestServerComponent, { text: 'Hello World' });
    
    // Assert
    expect(html).toContain('<h1>Server Component</h1>');
    expect(html).toContain('<p data-testid="test-content">Hello World</p>');
  });
  
  it('should provide a container with the rendered content', async () => {
    // Arrange & Act
    const { container } = await renderServerComponent(TestServerComponent, { text: 'Test Content' });
    
    // Assert
    expect(container).toBeDefined();
    expect(container?.innerHTML).toContain('Server Component');
    expect(container?.innerHTML).toContain('Test Content');
  });
  
  it('should provide a getByText helper that works correctly', async () => {
    // Arrange & Act
    const { getByText } = await renderServerComponent(TestServerComponent, { text: 'Find Me' });
    
    // Assert
    const element = getByText('Find Me');
    expect(element).toBeTruthy();
    expect(element?.textContent).toContain('Find Me');
  });
  
  it('should provide a queryBySelector helper that works correctly', async () => {
    // Arrange & Act
    const { queryBySelector } = await renderServerComponent(TestServerComponent, { text: 'Test' });
    
    // Assert
    const heading = queryBySelector('h1');
    expect(heading).toBeTruthy();
    expect(heading?.textContent).toBe('Server Component');
    
    // Should return null for non-existent elements
    const nonExistent = queryBySelector('.non-existent');
    expect(nonExistent).toBeNull();
  });
  
  it('should provide a queryAllBySelector helper that works correctly', async () => {
    // Arrange & Act
    const { queryAllBySelector } = await renderServerComponent(TestServerComponent, { text: 'Test' });
    
    // Assert
    const listItems = queryAllBySelector('li');
    expect(listItems).toHaveLength(2);
    expect(listItems[0]?.textContent).toBe('Item 1');
    expect(listItems[1]?.textContent).toBe('Item 2');
    
    // Should return empty array for non-existent elements
    const nonExistent = queryAllBySelector('.non-existent');
    expect(nonExistent).toHaveLength(0);
  });
}); 