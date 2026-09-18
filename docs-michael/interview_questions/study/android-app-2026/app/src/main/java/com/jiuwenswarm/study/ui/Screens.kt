package com.jiuwenswarm.study.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Bookmark
import androidx.compose.material.icons.outlined.BookmarkBorder
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilledTonalButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.jiuwenswarm.study.data.AnchorDto
import com.jiuwenswarm.study.data.QuestionEntity
import com.jiuwenswarm.study.data.Repo
import com.jiuwenswarm.study.data.StudyItem
import kotlinx.coroutines.launch

@Composable
private fun Section(title: String, body: String) {
    if (body.isBlank()) return
    Column(Modifier.fillMaxWidth().padding(vertical = 6.dp)) {
        Text(title, style = MaterialTheme.typography.titleSmall, color = MaterialTheme.colorScheme.primary)
        Spacer(Modifier.height(4.dp))
        MarkdownText(body)
    }
}

@Composable
private fun AnchorsBlock(anchors: List<AnchorDto>) {
    if (anchors.isEmpty()) return
    var open by remember { mutableStateOf(false) }
    Column(Modifier.fillMaxWidth().padding(vertical = 6.dp)) {
        TextButton(onClick = { open = !open }) {
            Text(if (open) "Hide code anchors" else "Anchors (${anchors.size})")
        }
        if (open) {
            Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)) {
                Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    anchors.forEach { a ->
                        Text(a.ref, style = MaterialTheme.typography.bodySmall, fontWeight = FontWeight.Medium)
                        if (a.desc.isNotBlank())
                            Text(a.desc, style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                }
            }
        }
    }
}

// ---------------------------------------------------------------- Today

@Composable
fun TodayScreen(repo: Repo, onStudy: () -> Unit, onExplore: () -> Unit) {
    val now = remember { System.currentTimeMillis() }
    val due by repo.dueCount(now).collectAsStateWithLifecycle(0)
    val new by repo.newCount().collectAsStateWithLifecycle(0)
    val learned by repo.learnedCount().collectAsStateWithLifecycle(0)
    val days by repo.activeDays().collectAsStateWithLifecycle(0)
    val total by repo.totalReviews().collectAsStateWithLifecycle(0)

    Column(
        Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        Text("Today", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold)
        val todo = due + new
        Card(Modifier.fillMaxWidth()) {
            Row(Modifier.padding(20.dp), verticalAlignment = Alignment.CenterVertically) {
                Box(Modifier.size(96.dp), contentAlignment = Alignment.Center) {
                    ProgressRing(if (todo == 0) 1f else 0f)
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("$due", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
                        Text("due", style = MaterialTheme.typography.labelSmall)
                    }
                }
                Spacer(Modifier.width(20.dp))
                Column(Modifier.weight(1f)) {
                    Text(if (todo == 0) "All caught up" else "$todo cards to review",
                        style = MaterialTheme.typography.titleMedium)
                    Spacer(Modifier.height(4.dp))
                    Text("$new new · $learned learned", style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
        }
        Button(onClick = onStudy, Modifier.fillMaxWidth().height(56.dp)) {
            Text(if (todo == 0) "Practice anyway" else "Start review", style = MaterialTheme.typography.titleMedium)
        }
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            StatCard("Streak", "$days d", Modifier.weight(1f))
            StatCard("Reviews", "$total", Modifier.weight(1f))
        }
        OutlinedButton(onClick = onExplore, Modifier.fillMaxWidth()) { Text("Explore topics") }
    }
}

@Composable
private fun StatCard(label: String, value: String, modifier: Modifier = Modifier) {
    Card(modifier) {
        Column(Modifier.padding(16.dp)) {
            Text(value, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
            Text(label, style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

// ---------------------------------------------------------------- Study

@Composable
fun StudyScreen(repo: Repo, onOpen: (String) -> Unit) {
    val scope = rememberCoroutineScope()
    var queue by remember { mutableStateOf<List<StudyItem>?>(null) }
    var index by remember { mutableIntStateOf(0) }
    var reveal by remember { mutableIntStateOf(0) }

    androidx.compose.runtime.LaunchedEffect(Unit) { queue = repo.buildQueue() }

    val q = queue
    if (q == null) {
        Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) { Text("Loading…") }
        return
    }
    if (index >= q.size) {
        Column(
            Modifier.fillMaxSize().padding(24.dp),
            verticalArrangement = Arrangement.Center, horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Text("Done for now", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold)
            Spacer(Modifier.height(8.dp))
            Text("Reviewed ${q.size} cards.", color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        return
    }

    val item = q[index]
    Column(Modifier.fillMaxSize().padding(20.dp)) {
        Text("${index + 1} / ${q.size}", style = MaterialTheme.typography.labelLarge,
            color = MaterialTheme.colorScheme.onSurfaceVariant)
        Spacer(Modifier.height(8.dp))
        Column(Modifier.weight(1f).verticalScroll(rememberScrollState())) {
            Text(item.question.question, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.SemiBold)
            Spacer(Modifier.height(12.dp))
            if (reveal >= 1) Section("General", item.question.general)
            if (reveal >= 2) Section("Jiuwen", item.question.jiuwen)
            if (reveal >= 3 && item.question.diagram.isNotBlank()) {
                Spacer(Modifier.height(8.dp))
                DiagramImage(item.question.diagram)
            }
            if (reveal >= 4) {
                Section("Gap", item.question.gap)
                AnchorsBlock(repo.anchors(item.question))
                TextButton(onClick = { onOpen(item.question.id) }) { Text("Open full card") }
            }
        }
        Spacer(Modifier.height(12.dp))
        if (reveal < 4) {
            Button(onClick = { reveal++ }, Modifier.fillMaxWidth().height(52.dp)) {
                Text(if (reveal == 0) "Show answer" else "Show more")
            }
        } else {
            RatingBar { rating ->
                scope.launch {
                    repo.rate(item.question.id, rating)
                    index++
                    reveal = 0
                }
            }
        }
    }
}

// ---------------------------------------------------------------- Explore

@Composable
fun ExploreScreen(repo: Repo, onTopic: (String) -> Unit) {
    val topics by repo.topics.collectAsStateWithLifecycle(emptyList())
    LazyColumn(Modifier.fillMaxSize(), contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp)) {
        item { Text("Topics", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold) }
        items(topics, key = { it.id }) { t ->
            Card(Modifier.fillMaxWidth().clickable { onTopic(t.id) }) {
                Row(Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                    Text(t.id, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary)
                    Spacer(Modifier.width(14.dp))
                    Text(t.title, style = MaterialTheme.typography.titleMedium, modifier = Modifier.weight(1f))
                }
            }
        }
    }
}

@Composable
fun TopicScreen(repo: Repo, topicId: String, onQuestion: (String) -> Unit) {
    val questions by repo.questionsForTopic(topicId).collectAsStateWithLifecycle(emptyList())
    LazyColumn(Modifier.fillMaxSize(), contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)) {
        items(questions, key = { it.id }) { q ->
            Card(Modifier.fillMaxWidth().clickable { onQuestion(q.id) }) {
                Row(Modifier.padding(14.dp), verticalAlignment = Alignment.Top) {
                    Text("${q.number}", fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                    Spacer(Modifier.width(12.dp))
                    Text(q.question, modifier = Modifier.weight(1f), maxLines = 3, overflow = TextOverflow.Ellipsis)
                }
            }
        }
    }
}

// ---------------------------------------------------------------- Question (read)

@Composable
fun QuestionScreen(repo: Repo, questionId: String) {
    val q by repo.question(questionId).collectAsStateWithLifecycle(null)
    val card by repo.card(questionId).collectAsStateWithLifecycle(null)
    val bookmarks by repo.bookmarkIds().collectAsStateWithLifecycle(emptyList())
    val note by repo.note(questionId).collectAsStateWithLifecycle(null)
    var noteText by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()
    val isBookmarked = bookmarks.contains(questionId)

    val item = q ?: return
    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(20.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(item.topicId, color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold)
            Spacer(Modifier.weight(1f))
            IconButton(onClick = { scope.launch { repo.toggleBookmark(questionId, isBookmarked) } }) {
                Icon(if (isBookmarked) Icons.Filled.Bookmark else Icons.Outlined.BookmarkBorder,
                    contentDescription = "Bookmark")
            }
        }
        Text(item.question, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.SemiBold)
        Spacer(Modifier.height(12.dp))
        Section("General", item.general)
        Section("Jiuwen", item.jiuwen)
        if (item.diagram.isNotBlank()) { Spacer(Modifier.height(8.dp)); DiagramImage(item.diagram) }
        Section("Gap", item.gap)
        AnchorsBlock(repo.anchors(item))
        Spacer(Modifier.height(12.dp))
        LinearProgressIndicator(
            progress = { ((card?.state ?: 0).coerceIn(0, 3)) / 3f },
            modifier = Modifier.fillMaxWidth(),
        )
        Spacer(Modifier.height(16.dp))
        Text("Your note", style = MaterialTheme.typography.titleSmall)
        OutlinedTextField(
            value = noteText ?: note?.text ?: "",
            onValueChange = { noteText = it },
            modifier = Modifier.fillMaxWidth(),
            minLines = 2,
            keyboardOptions = KeyboardOptions(imeAction = ImeAction.Done),
        )
        Row(horizontalArrangement = Arrangement.End, modifier = Modifier.fillMaxWidth()) {
            TextButton(onClick = {
                scope.launch { repo.saveNote(questionId, noteText ?: note?.text ?: ""); noteText = null }
            }) { Text("Save note") }
        }
    }
}

// ---------------------------------------------------------------- Progress

@Composable
fun ProgressScreen(repo: Repo) {
    val learned by repo.learnedCount().collectAsStateWithLifecycle(0)
    val new by repo.newCount().collectAsStateWithLifecycle(0)
    val total by repo.totalReviews().collectAsStateWithLifecycle(0)
    val days by repo.activeDays().collectAsStateWithLifecycle(0)
    val mastery by repo.mastery().collectAsStateWithLifecycle(0.0)
    val all = learned + new

    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)) {
        Text("Progress", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold)
        Card(Modifier.fillMaxWidth()) {
            Row(Modifier.padding(20.dp), verticalAlignment = Alignment.CenterVertically) {
                Box(Modifier.size(110.dp), contentAlignment = Alignment.Center) {
                    ProgressRing((mastery ?: 0.0).toFloat())
                    Text("${((mastery ?: 0.0) * 100).toInt()}%", fontWeight = FontWeight.Bold)
                }
                Spacer(Modifier.width(20.dp))
                Column {
                    Text("Mastery", style = MaterialTheme.typography.titleMedium)
                    Text("$learned of $all questions learned",
                        color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
        }
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            StatCard("Reviews", "$total", Modifier.weight(1f))
            StatCard("Active days", "$days", Modifier.weight(1f))
        }
    }
}

// ---------------------------------------------------------------- Search

@Composable
fun SearchScreen(repo: Repo, onQuestion: (String) -> Unit) {
    var query by remember { mutableStateOf("") }
    val flow = remember(query) {
        if (query.length >= 2) repo.search(query) else kotlinx.coroutines.flow.flowOf(emptyList())
    }
    val list by flow.collectAsStateWithLifecycle(emptyList())

    Column(Modifier.fillMaxSize().padding(16.dp)) {
        OutlinedTextField(
            value = query, onValueChange = { query = it },
            modifier = Modifier.fillMaxWidth(),
            placeholder = { Text("Search questions…") },
            singleLine = true,
        )
        Spacer(Modifier.height(10.dp))
        LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            items(list, key = { it.id }) { q ->
                Card(Modifier.fillMaxWidth().clickable { onQuestion(q.id) }) {
                    Column(Modifier.padding(14.dp)) {
                        Text(q.topicId, style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.primary)
                        Text(q.question, maxLines = 2, overflow = TextOverflow.Ellipsis)
                    }
                }
            }
        }
    }
}
