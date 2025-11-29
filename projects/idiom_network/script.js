const nodes = new vis.DataSet([]);
const edges = new vis.DataSet([]);
let network = null;

// Track expanded nodes to prevent duplicate fetches
const expandedNodes = new Set();

function initNetwork() {
    const container = document.getElementById('network');
    const data = { nodes: nodes, edges: edges };
    const options = {
        nodes: {
            shape: 'dot',
            size: 20,
            font: {
                size: 16,
                face: 'Poppins'
            },
            borderWidth: 2,
            shadow: true
        },
        edges: {
            width: 2,
            shadow: true,
            smooth: {
                type: 'continuous'
            }
        },
        physics: {
            stabilization: false,
            barnesHut: {
                gravitationalConstant: -8000,
                springConstant: 0.04,
                springLength: 95
            }
        },
        interaction: {
            hover: true
        }
    };
    network = new vis.Network(container, data, options);

    network.on("click", function (params) {
        if (params.nodes.length > 0) {
            const nodeId = params.nodes[0];
            const nodeLabel = nodes.get(nodeId).label;
            expandNode(nodeId, nodeLabel);
        }
    });
}

async function fetchRelated(term) {
    // 'ml' = means like (related meaning)
    try {
        const response = await fetch(`https://api.datamuse.com/words?ml=${encodeURIComponent(term)}&max=15`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("API Error:", error);
        return [];
    }
}

async function expandNode(sourceId, term) {
    if (expandedNodes.has(sourceId)) return;

    // Visual feedback
    nodes.update({ id: sourceId, color: { background: '#fab1a0' } }); // Mark as processing/expanded

    const relatedWords = await fetchRelated(term);

    // Take top 8 results to avoid clutter
    const topWords = relatedWords.slice(0, 8);

    if (topWords.length === 0) {
        // alert("No related terms found.");
        // Just mark as done
        nodes.update({ id: sourceId, color: { background: '#ffeaa7', border: '#fdcb6e' } });
        expandedNodes.add(sourceId);
        return;
    }

    const newNodes = [];
    const newEdges = [];

    topWords.forEach(wordObj => {
        const word = wordObj.word;
        // Check if node already exists to avoid duplicates
        const existingNodes = nodes.get({
            filter: function (item) {
                return item.label === word;
            }
        });

        let targetId;
        if (existingNodes.length > 0) {
            targetId = existingNodes[0].id;
        } else {
            targetId = Math.random().toString(36).substr(2, 9);
            newNodes.push({
                id: targetId,
                label: word,
                color: { background: '#a29bfe', border: '#6c5ce7' }
            });
        }

        // Add edge if not exists
        // (Vis.js handles duplicate edges if configured, but let's just push)
        newEdges.push({ from: sourceId, to: targetId });
    });

    nodes.add(newNodes);
    edges.add(newEdges);
    expandedNodes.add(sourceId);

    // Mark source as fully expanded
    nodes.update({ id: sourceId, color: { background: '#ffeaa7', border: '#fdcb6e' } });
}

function startSearch() {
    const term = document.getElementById('searchInput').value.trim();
    if (!term) return;

    // Clear previous
    nodes.clear();
    edges.clear();
    expandedNodes.clear();

    // Add root node
    const rootId = 'root';
    nodes.add({
        id: rootId,
        label: term,
        size: 30,
        color: { background: '#ff7675', border: '#d63031' },
        font: { size: 20, color: 'white' }
    });

    // Auto-expand root
    expandNode(rootId, term);
}

document.getElementById('searchBtn').addEventListener('click', startSearch);
document.getElementById('searchInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') startSearch();
});

document.getElementById('clearBtn').addEventListener('click', () => {
    nodes.clear();
    edges.clear();
    expandedNodes.clear();
    document.getElementById('searchInput').value = '';
});

// Initialize
initNetwork();
