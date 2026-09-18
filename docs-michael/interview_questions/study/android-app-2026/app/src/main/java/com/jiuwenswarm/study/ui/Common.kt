package com.jiuwenswarm.study.ui

import android.graphics.BitmapFactory
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.gestures.rememberTransformableState
import androidx.compose.foundation.gestures.transformable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ChevronLeft
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material3.AssistChip
import androidx.compose.material3.AssistChipDefaults
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.jiuwenswarm.study.data.CitationDto

/** Minimal, dependency-free markdown renderer: **bold** and `code` spans. */
fun renderMarkdown(text: String): AnnotatedString {
    val regex = Regex("\\*\\*.+?\\*\\*|`[^`]+`", RegexOption.DOT_MATCHES_ALL)
    return buildAnnotatedString {
        var last = 0
        for (m in regex.findAll(text)) {
            append(text.substring(last, m.range.first))
            val tok = m.value
            if (tok.startsWith("**")) {
                withStyle(SpanStyle(fontWeight = FontWeight.Bold)) { append(tok.substring(2, tok.length - 2)) }
            } else {
                withStyle(SpanStyle(fontFamily = FontFamily.Monospace, background = Color(0x22607090))) {
                    append(tok.substring(1, tok.length - 1))
                }
            }
            last = m.range.last + 1
        }
        append(text.substring(last))
    }
}

@Composable
fun MarkdownText(text: String, modifier: Modifier = Modifier) {
    Text(text = remember(text) { renderMarkdown(text) },
        style = MaterialTheme.typography.bodyLarge, modifier = modifier)
}

@Composable
fun TypeBadge(type: String) {
    val color = when (type) {
        "compare" -> MaterialTheme.colorScheme.tertiary
        "design" -> MaterialTheme.colorScheme.secondary
        "mechanism" -> MaterialTheme.colorScheme.primary
        "behavioral" -> MaterialTheme.colorScheme.error
        else -> MaterialTheme.colorScheme.outline
    }
    Box(
        Modifier.background(color.copy(alpha = 0.15f), RoundedCornerShape(999.dp))
            .padding(horizontal = 10.dp, vertical = 3.dp),
    ) {
        Text(type.replaceFirstChar { it.uppercase() }, style = MaterialTheme.typography.labelSmall, color = color)
    }
}

@Composable
fun ProgressRing(
    progress: Float,
    modifier: Modifier = Modifier,
    color: Color = MaterialTheme.colorScheme.primary,
    track: Color = MaterialTheme.colorScheme.surfaceVariant,
) {
    Canvas(modifier = modifier) {
        val stroke = size.minDimension * 0.12f
        drawArc(color = track, startAngle = -90f, sweepAngle = 360f, useCenter = false,
            style = Stroke(width = stroke, cap = StrokeCap.Round))
        drawArc(color = color, startAngle = -90f, sweepAngle = 360f * progress.coerceIn(0f, 1f),
            useCenter = false, style = Stroke(width = stroke, cap = StrokeCap.Round))
    }
}

// --------------------------------------------------------------------- answer layers

@Composable
fun PointsList(points: List<String>) {
    if (points.isEmpty()) return
    val checked = remember(points) { mutableStateListOf<Boolean>().apply { repeat(points.size) { add(false) } } }
    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
        points.forEachIndexed { i, p ->
            Row(
                Modifier.fillMaxWidth().clickable { checked[i] = !checked[i] },
                verticalAlignment = Alignment.Top,
            ) {
                Text(
                    if (checked[i]) "✓" else "${i + 1}",
                    fontWeight = FontWeight.Bold,
                    color = if (checked[i]) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.outline,
                    modifier = Modifier.width(24.dp),
                )
                Text(p, style = MaterialTheme.typography.bodyLarge)
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)
@Composable
fun CitationChips(citations: List<CitationDto>) {
    if (citations.isEmpty()) return
    var selected by remember { mutableStateOf<CitationDto?>(null) }
    FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        citations.forEach { c ->
            AssistChip(
                onClick = { selected = c },
                label = { Text(c.symbol.ifBlank { c.ref.substringAfterLast('/') }, maxLines = 1) },
                leadingIcon = { Icon(Icons.Filled.ContentCopy, null, Modifier.size(AssistChipDefaults.IconSize)) },
            )
        }
    }
    selected?.let { c ->
        ModalBottomSheet(onDismissRequest = { selected = null }, sheetState = rememberModalBottomSheetState()) {
            val clip = LocalClipboardManager.current
            Column(Modifier.fillMaxWidth().padding(20.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                TypeBadge(c.kind)
                Text(c.symbol.ifBlank { "Code reference" }, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                Text(c.ref, style = MaterialTheme.typography.bodyMedium, fontFamily = FontFamily.Monospace)
                if (c.desc.isNotBlank()) Text(c.desc, style = MaterialTheme.typography.bodyMedium)
                if (c.lines.isNotBlank()) Text("lines ${c.lines}", style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant)
                Row(horizontalArrangement = Arrangement.End, modifier = Modifier.fillMaxWidth()) {
                    TextButton(onClick = { clip.setText(AnnotatedString("${c.ref}\n${c.desc}")); selected = null }) {
                        Text("Copy")
                    }
                }
                Spacer(Modifier.height(8.dp))
            }
        }
    }
}

@Composable
fun DiagramStepper(steps: List<String>) {
    if (steps.size < 2) return
    var idx by remember { mutableIntStateOf(0) }
    Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
        IconButton(onClick = { if (idx > 0) idx-- }, enabled = idx > 0) {
            Icon(Icons.Filled.ChevronLeft, "Previous step")
        }
        Column(Modifier.weight(1f)) {
            Text("Step ${idx + 1} / ${steps.size}", style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant)
            Text(steps[idx], style = MaterialTheme.typography.bodyMedium)
        }
        IconButton(onClick = { if (idx < steps.size - 1) idx++ }, enabled = idx < steps.size - 1) {
            Icon(Icons.Filled.ChevronRight, "Next step")
        }
    }
}

/** Pinch-to-zoom, drag-to-pan, double-tap-to-toggle image. */
@Composable
private fun ZoomableImage(bitmap: ImageBitmap, modifier: Modifier = Modifier) {
    var scale by remember { mutableFloatStateOf(1f) }
    var offset by remember { mutableStateOf(Offset.Zero) }
    val state = rememberTransformableState { zoomChange, panChange, _ ->
        val ns = (scale * zoomChange).coerceIn(1f, 12f)
        scale = ns
        offset = if (ns <= 1f) Offset.Zero else offset + panChange
    }
    Box(
        modifier.fillMaxSize().pointerInput(Unit) {
            detectTapGestures(onDoubleTap = {
                if (scale > 1f) { scale = 1f; offset = Offset.Zero } else scale = 3f
            })
        },
        contentAlignment = Alignment.Center,
    ) {
        Image(
            bitmap = bitmap, contentDescription = "diagram", contentScale = ContentScale.Fit,
            modifier = Modifier.fillMaxWidth().graphicsLayer {
                scaleX = scale; scaleY = scale
                translationX = offset.x; translationY = offset.y
            }.transformable(state),
        )
    }
}

@Composable
private fun DiagramViewer(bitmap: ImageBitmap, onClose: () -> Unit) {
    Dialog(onDismissRequest = onClose, properties = DialogProperties(usePlatformDefaultWidth = false)) {
        Box(Modifier.fillMaxSize().background(Color(0xF0000000))) {
            ZoomableImage(bitmap, Modifier.fillMaxSize())
            IconButton(onClick = onClose, modifier = Modifier.align(Alignment.TopEnd).padding(12.dp)) {
                Icon(Icons.Filled.Close, contentDescription = "Close", tint = Color.White)
            }
            Text("Pinch to zoom · drag to pan · double-tap to toggle", color = Color.White,
                style = MaterialTheme.typography.labelSmall,
                modifier = Modifier.align(Alignment.BottomCenter).padding(16.dp))
        }
    }
}

/** Inline diagram; tap to open the full-screen zoomable viewer. */
@Composable
fun DiagramImage(path: String, modifier: Modifier = Modifier) {
    if (path.isBlank()) return
    val context = LocalContext.current
    val bitmap = remember(path) {
        runCatching { context.assets.open(path).use { BitmapFactory.decodeStream(it) } }.getOrNull()
    }
    val image = remember(bitmap) { bitmap?.asImageBitmap() }
    if (image == null) return
    var open by remember { mutableStateOf(false) }
    Column(modifier) {
        Box(
            Modifier.fillMaxWidth()
                .background(MaterialTheme.colorScheme.surfaceVariant, RoundedCornerShape(12.dp))
                .clickable { open = true }.padding(8.dp),
            contentAlignment = Alignment.Center,
        ) {
            Image(bitmap = image, contentDescription = "diagram",
                contentScale = ContentScale.Fit, modifier = Modifier.fillMaxWidth())
        }
        Text("Tap to zoom", style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.padding(top = 4.dp))
    }
    if (open) DiagramViewer(image) { open = false }
}

@Composable
fun RatingBar(onRate: (Int) -> Unit) {
    val labels = listOf("Again", "Hard", "Good", "Easy")
    val colors = listOf(Color(0xFFE5484D), Color(0xFFF5A524), Color(0xFF30A46C), Color(0xFF3E63DD))
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        labels.forEachIndexed { i, label ->
            Button(
                onClick = { onRate(i + 1) },
                modifier = Modifier.weight(1f),
                colors = ButtonDefaults.buttonColors(containerColor = colors[i], contentColor = Color.White),
                shape = RoundedCornerShape(12.dp),
                contentPadding = androidx.compose.foundation.layout.PaddingValues(vertical = 12.dp),
            ) { Text(label, maxLines = 1) }
        }
    }
}
